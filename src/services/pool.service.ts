/**
 * Pool Service
 * 
 * Handles pool detection, validation, and information retrieval
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { logger } from '../utils/logger';
import { PoolInfo } from '../types';
import { PoolError } from '../errors';
import { fetchPoolOnMeteoraDYN } from '../utils/meteoraSwap';
import { TOKEN_ADDRESSES } from '../config/constants';

/**
 * Service for managing pool operations
 */
export class PoolService {
  constructor(
    private readonly connection: Connection,
    private readonly keypair: Keypair
  ) {}

  /**
   * Extracts pool information from transaction accounts
   * @param accounts - Array of account addresses from transaction
   * @param transactionSignature - Transaction signature for logging
   * @returns Pool information if found, null otherwise
   */
  async findPoolFromAccounts(
    accounts: string[],
    transactionSignature: string
  ): Promise<PoolInfo | null> {
    try {
      let poolId = '';
      let poolState = null;

      // Try to find a valid pool from the accounts
      for (let i = 1; i < accounts.length; i++) {
        try {
          const accountPub = new PublicKey(accounts[i]);
          const pool = await fetchPoolOnMeteoraDYN(this.connection, accountPub, this.keypair);
          
          if (pool) {
            poolId = accounts[i];
            poolState = pool;
            break;
          }
        } catch (error) {
          // Continue to next account if this one fails
          continue;
        }
      }

      if (!poolId || !poolState) {
        return null;
      }

      // Verify it's a SOL/token pair
      const tokenAMint = poolState.tokenAMint.toBase58();
      const tokenBMint = poolState.tokenBMint.toBase58();
      
      if (tokenAMint !== TOKEN_ADDRESSES.WSOL && tokenBMint !== TOKEN_ADDRESSES.WSOL) {
        logger.debug({ tokenAMint, tokenBMint }, 'Pool is not a SOL pair, skipping');
        return null;
      }

      const tokenMint = tokenAMint === TOKEN_ADDRESSES.WSOL 
        ? poolState.tokenBMint 
        : poolState.tokenAMint;

      return {
        poolId,
        poolState,
        tokenMint,
        transactionSignature,
      };
    } catch (error) {
      logger.error({ error, transactionSignature }, 'Error finding pool from accounts');
      throw new PoolError(
        `Failed to find pool from accounts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        transactionSignature
      );
    }
  }

  /**
   * Validates that a pool is a valid SOL/token pair
   * @param poolState - The pool state to validate
   * @returns True if valid, false otherwise
   */
  isValidSolPair(poolState: any): boolean {
    if (!poolState) return false;
    
    const tokenAMint = poolState.tokenAMint?.toBase58();
    const tokenBMint = poolState.tokenBMint?.toBase58();
    
    return (
      (tokenAMint === TOKEN_ADDRESSES.WSOL || tokenBMint === TOKEN_ADDRESSES.WSOL) &&
      tokenAMint !== tokenBMint
    );
  }
}

