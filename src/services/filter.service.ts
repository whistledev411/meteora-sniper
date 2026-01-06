/**
 * Filter Service
 * 
 * Handles token filtering based on configured criteria
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '../utils/logger';
import { FilterConfig, FilterResult, MarketData } from '../types';
import { FilterError } from '../errors';
import { checkBurn, checkMintable, checkTicker, getFreezeAuthority } from '../utils/filters';
import { getLiquidity, getMarketCap } from '../utils/meteoraSwap';
import { Keypair } from '@solana/web3.js';

/**
 * Service for filtering tokens based on various criteria
 */
export class FilterService {
  constructor(
    private readonly connection: Connection,
    private readonly keypair: Keypair,
    private readonly config: FilterConfig
  ) {}

  /**
   * Applies all configured filters to a token
   * @param tokenMint - The token mint address
   * @param poolId - The pool address
   * @param lpMint - The LP mint address (for burn check)
   * @returns Filter result indicating if token passed all filters
   */
  async applyFilters(
    tokenMint: PublicKey,
    poolId: PublicKey,
    lpMint?: PublicKey
  ): Promise<FilterResult> {
    try {
      // Check mintable status
      if (this.config.checkMintable) {
        const result = await this.checkMintableFilter(tokenMint);
        if (!result.passed) return result;
      }

      // Check LP burn status
      if (this.config.checkBurned && lpMint) {
        const result = await this.checkBurnFilter(lpMint);
        if (!result.passed) return result;
      }

      // Check freeze authority
      if (this.config.checkFreezable) {
        const result = await this.checkFreezeFilter(tokenMint);
        if (!result.passed) return result;
      }

      // Check keyword match
      if (this.config.checkKeyword && this.config.keyword) {
        const result = await this.checkKeywordFilter(tokenMint, this.config.keyword);
        if (!result.passed) return result;
      }

      // Check market cap
      if (this.config.checkMarketCap) {
        const result = await this.checkMarketCapFilter(poolId);
        if (!result.passed) return result;
      }

      // Check liquidity
      if (this.config.checkLiquidity) {
        const result = await this.checkLiquidityFilter(poolId);
        if (!result.passed) return result;
      }

      return { passed: true };
    } catch (error) {
      logger.error({ error, tokenMint: tokenMint.toBase58() }, 'Error applying filters');
      return {
        passed: false,
        reason: `Filter error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Checks if token mint authority is renounced
   */
  private async checkMintableFilter(tokenMint: PublicKey): Promise<FilterResult> {
    try {
      const isMintable = await checkMintable(this.connection, tokenMint);
      if (isMintable) {
        return {
          passed: false,
          reason: 'Token has mint authority (not renounced)',
        };
      }
      return { passed: true };
    } catch (error) {
      throw new FilterError(
        `Failed to check mintable status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'mintable'
      );
    }
  }

  /**
   * Checks if LP tokens are burned
   */
  private async checkBurnFilter(lpMint: PublicKey): Promise<FilterResult> {
    try {
      const isBurned = await checkBurn(lpMint);
      if (!isBurned) {
        return {
          passed: false,
          reason: 'LP tokens are not burned',
        };
      }
      return { passed: true };
    } catch (error) {
      throw new FilterError(
        `Failed to check burn status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'burn'
      );
    }
  }

  /**
   * Checks if token has freeze authority
   */
  private async checkFreezeFilter(tokenMint: PublicKey): Promise<FilterResult> {
    try {
      const hasFreezeAuthority = await getFreezeAuthority(tokenMint);
      if (hasFreezeAuthority) {
        return {
          passed: false,
          reason: 'Token has freeze authority',
        };
      }
      return { passed: true };
    } catch (error) {
      throw new FilterError(
        `Failed to check freeze authority: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'freeze'
      );
    }
  }

  /**
   * Checks if token symbol/name matches keyword
   */
  private async checkKeywordFilter(tokenMint: PublicKey, keyword: string): Promise<FilterResult> {
    try {
      const matches = await checkTicker(this.connection, tokenMint, keyword);
      if (!matches) {
        return {
          passed: false,
          reason: `Token symbol/name does not match keyword: ${keyword}`,
        };
      }
      return { passed: true };
    } catch (error) {
      throw new FilterError(
        `Failed to check keyword: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'keyword'
      );
    }
  }

  /**
   * Checks if market cap is within configured range
   */
  private async checkMarketCapFilter(poolId: PublicKey): Promise<FilterResult> {
    try {
      const marketCap = await getMarketCap(this.connection, this.keypair, poolId);
      
      if (!marketCap || marketCap <= 0) {
        return {
          passed: false,
          reason: 'Could not determine market cap',
        };
      }

      const min = this.config.minMarketCap || 0;
      const max = this.config.maxMarketCap || Infinity;

      if (marketCap < min || marketCap > max) {
        return {
          passed: false,
          reason: `Market cap $${marketCap.toFixed(2)} is outside range ($${min} - $${max})`,
        };
      }

      logger.info({ marketCap, poolId: poolId.toBase58() }, 'Market cap check passed');
      return { passed: true };
    } catch (error) {
      throw new FilterError(
        `Failed to check market cap: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'marketCap'
      );
    }
  }

  /**
   * Checks if liquidity is within configured range
   */
  private async checkLiquidityFilter(poolId: PublicKey): Promise<FilterResult> {
    try {
      const liquidity = await getLiquidity(this.connection, this.keypair, poolId);
      
      if (!liquidity || liquidity <= 0) {
        return {
          passed: false,
          reason: 'Could not determine liquidity',
        };
      }

      const min = this.config.minLiquidity || 0;
      const max = this.config.maxLiquidity || Infinity;

      if (liquidity < min || liquidity > max) {
        return {
          passed: false,
          reason: `Liquidity ${liquidity.toFixed(2)} SOL is outside range (${min} - ${max} SOL)`,
        };
      }

      logger.info({ liquidity, poolId: poolId.toBase58() }, 'Liquidity check passed');
      return { passed: true };
    } catch (error) {
      throw new FilterError(
        `Failed to check liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'liquidity'
      );
    }
  }

  /**
   * Gets market data for a pool
   */
  async getMarketData(poolId: PublicKey): Promise<MarketData> {
    try {
      const [marketCap, liquidity] = await Promise.all([
        getMarketCap(this.connection, this.keypair, poolId).catch(() => null),
        getLiquidity(this.connection, this.keypair, poolId).catch(() => null),
      ]);

      return {
        marketCap,
        liquidity,
        price: null, // Can be calculated from market cap and supply if needed
      };
    } catch (error) {
      logger.error({ error, poolId: poolId.toBase58() }, 'Error getting market data');
      return {
        marketCap: null,
        liquidity: null,
        price: null,
      };
    }
  }
}

