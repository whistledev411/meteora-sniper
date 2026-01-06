/**
 * Sniper Service
 * 
 * Main service that orchestrates pool detection, filtering, and swap execution
 */

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { logger } from '../utils/logger';
import { AppContext, PoolInfo, SwapResult } from '../types';
import { PoolService } from './pool.service';
import { FilterService } from './filter.service';
import { SwapService } from './swap.service';
import { StreamService } from './stream.service';
import bs58 from 'bs58';

/**
 * Main sniper service that coordinates all operations
 */
export class SniperService {
  private poolService: PoolService;
  private filterService: FilterService;
  private swapService: SwapService;
  private streamService: StreamService;

  constructor(private readonly context: AppContext) {
    this.poolService = new PoolService(context.connection, context.keypair);
    this.filterService = new FilterService(
      context.connection,
      context.keypair,
      context.config.filters
    );
    this.swapService = new SwapService(
      context.connection,
      context.keypair,
      context.config.execution
    );
    this.streamService = new StreamService();
  }

  /**
   * Starts the sniper bot
   */
  async start(): Promise<void> {
    try {
      logger.info('Starting Meteora Sniper Bot...');
      
      // Connect to Geyser stream
      await this.streamService.connect(
        this.context.config.grpcEndpoint,
        this.context.config.grpcToken
      );

      // Start listening to stream events
      await this.streamService.listen(async (data) => {
        await this.handleStreamData(data);
      });
    } catch (error) {
      logger.error({ error }, 'Failed to start sniper service');
      throw error;
    }
  }

  /**
   * Stops the sniper bot
   */
  stop(): void {
    this.streamService.disconnect();
    logger.info('Sniper service stopped');
  }

  /**
   * Handles incoming stream data
   */
  private async handleStreamData(data: any): Promise<void> {
    try {
      if (!data.transaction) {
        return;
      }

      const transaction = data.transaction;
      const logMessages = transaction.transaction?.meta?.logMessages;

      // Check if this is a vault initialization (new pool)
      const isVault = logMessages?.some((item: string) =>
        item.indexOf('Instruction: InitializeMint2') > -1
      );

      if (!isVault) {
        return;
      }

      const tx = this.decodeTransaction(data.transaction.transaction?.signature);
      const accounts: string[] = [];
      const accountKeys = transaction.transaction?.transaction?.message?.accountKeys;

      if (!accountKeys) {
        return;
      }

      for (let i = 0; i < accountKeys.length; i++) {
        const account = accountKeys[i];
        accounts.push(this.decodeTransaction(account));
      }

      // Find pool from accounts
      const poolInfo = await this.poolService.findPoolFromAccounts(accounts, tx);
      
      if (!poolInfo) {
        return;
      }

      logger.info({
        poolId: poolInfo.poolId,
        tokenMint: poolInfo.tokenMint.toBase58(),
        transaction: tx,
      }, 'New pool detected');

      // Apply filters
      const filterResult = await this.filterService.applyFilters(
        poolInfo.tokenMint,
        new PublicKey(poolInfo.poolId),
        poolInfo.poolState.lpMint
      );

      if (!filterResult.passed) {
        logger.info({
          poolId: poolInfo.poolId,
          reason: filterResult.reason,
        }, 'Pool filtered out');
        return;
      }

      // Get market data for logging
      const marketData = await this.filterService.getMarketData(
        new PublicKey(poolInfo.poolId)
      );

      logger.info({
        poolId: poolInfo.poolId,
        marketCap: marketData.marketCap,
        liquidity: marketData.liquidity,
      }, 'All filters passed, executing swap');

      // Execute swap
      const swapResult = await this.swapService.executeSwap(
        new PublicKey(poolInfo.poolId),
        this.context.config.buyAmount,
        this.context.secondWallet,
        this.context.config.slippage
      );

      if (swapResult.success && swapResult.signature) {
        logger.info({
          signature: swapResult.signature,
          poolId: poolInfo.poolId,
          url: `https://solscan.io/tx/${swapResult.signature}`,
        }, 'Swap executed successfully');
      } else {
        logger.error({
          error: swapResult.error,
          poolId: poolInfo.poolId,
        }, 'Swap execution failed');
      }
    } catch (error) {
      logger.error({ error }, 'Error handling stream data');
    }
  }

  /**
   * Decodes transaction data from base64 to base58
   */
  private decodeTransaction(
    data: WithImplicitCoercion<string> | { [Symbol.toPrimitive](hint: 'string'): string } | undefined
  ): string {
    if (!data) return '';
    return bs58.encode(Buffer.from(data, 'base64'));
  }
}

