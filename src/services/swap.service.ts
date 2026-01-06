/**
 * Swap Service
 * 
 * Handles token swap execution using various methods
 */

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from 'bn.js';
import { logger } from '../utils/logger';
import { SwapResult, ExecutionConfig, ExecutionMethod } from '../types';
import { TransactionError } from '../errors';
import { swapOnMeteoraDYN } from '../utils/meteoraSwap';
import { SOLANA_CONSTANTS } from '../config/constants';

/**
 * Service for executing token swaps
 */
export class SwapService {
  constructor(
    private readonly connection: Connection,
    private readonly keypair: Keypair,
    private readonly executionConfig: ExecutionConfig
  ) {}

  /**
   * Executes a swap on Meteora DYN pool
   * @param poolAddress - The pool address
   * @param buyAmount - Amount of SOL to spend (in SOL, not lamports)
   * @param toWallet - Wallet to transfer tokens to after purchase
   * @param slippage - Slippage tolerance percentage
   * @returns Swap result with signature if successful
   */
  async executeSwap(
    poolAddress: PublicKey,
    buyAmount: number,
    toWallet: PublicKey,
    slippage: number
  ): Promise<SwapResult> {
    try {
      const swapAmount = new BN(buyAmount * LAMPORTS_PER_SOL);
      
      logger.info({
        poolAddress: poolAddress.toBase58(),
        buyAmount,
        slippage,
        executionMethod: this.executionConfig.method,
      }, 'Executing swap');

      const signature = await swapOnMeteoraDYN(
        this.connection,
        poolAddress,
        this.keypair,
        swapAmount,
        false, // swapAtoB
        toWallet,
        slippage
      );

      if (signature) {
        logger.info(
          { signature, poolAddress: poolAddress.toBase58() },
          'Swap executed successfully'
        );
        return {
          success: true,
          signature,
        };
      } else {
        logger.warn({ poolAddress: poolAddress.toBase58() }, 'Swap execution returned no signature');
        return {
          success: false,
          error: 'Swap execution returned no signature',
        };
      }
    } catch (error) {
      logger.error(
        { error, poolAddress: poolAddress.toBase58() },
        'Swap execution failed'
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Gets the current execution method
   */
  getExecutionMethod(): ExecutionMethod {
    return this.executionConfig.method;
  }
}

