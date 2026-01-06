/**
 * Application constants
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Meteora program IDs
 */
export const METEORA_PROGRAMS = {
  DLMM: new PublicKey('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'),
  AMM: new PublicKey('Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB'),
  VAULT: new PublicKey('24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi'),
} as const;

/**
 * Common token addresses
 */
export const TOKEN_ADDRESSES = {
  WSOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
} as const;

/**
 * Jito tip accounts
 */
export const JITO_TIP_ACCOUNTS = [
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
] as const;

/**
 * NextBlock addresses
 */
export const NEXTBLOCK_ADDRESSES = [
  'NEXTbLoCkB51HpLBLojQfpyVAMorm3zzKg7w9NFdqid',
  'NeXTBLoCKs9F1y5PJS9CKrFNNLU1keHW71rfh7KgA1X',
  'NexTBLockJYZ7QD7p2byrUa6df8ndV2WSd8GkbWqfbb',
  'neXtBLock1LeC67jYd1QdAa32kbVeubsfPNTJC1V5At',
  'nEXTBLockYgngeRmRrjDV31mGSekVPqZoMGhQEZtPVG',
  'nextBLoCkPMgmG8ZgJtABeScP35qLa2AMCNKntAP7Xc',
  'NextbLoCkVtMGcV47JzewQdvBpLqT9TxQFozQkN98pE',
  'NexTbLoCkWykbLuB1NkjXgFWkX9oAtcoagQegygXXA2',
] as const;

/**
 * BloxRoute tip wallet
 */
export const BLOXROUTE_TIP_WALLET = 'HWEoBxYs7ssKuudEjzjmpfJVX7Dvi7wescFsVx2L5yoY';

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_DELAY_MS: 1000,
  POOL_FETCH_DELAY_MS: 500,
} as const;

/**
 * Solana constants
 */
export const SOLANA_CONSTANTS = {
  LAMPORTS_PER_SOL: 1_000_000_000,
  DEFAULT_COMMITMENT: 'confirmed' as const,
  DEFAULT_FINALITY: 'finalized' as const,
} as const;

