/**
 * Core type definitions for the Meteora Sniper Bot
 */

import { PublicKey, Keypair, Connection } from '@solana/web3.js';
import { BN } from 'bn.js';

/**
 * Configuration interface for the sniper bot
 */
export interface SniperConfig {
  // Wallet configuration
  privateKey: string;
  secondWallet: string;
  
  // RPC configuration
  rpcEndpoint: string;
  rpcWebsocketEndpoint?: string;
  
  // GRPC/Geyser configuration
  grpcEndpoint: string;
  grpcToken: string;
  
  // Trading configuration
  buyAmount: number;
  slippage: number;
  priorityFee: number;
  
  // Filtering configuration
  filters: FilterConfig;
  
  // Execution method configuration
  execution: ExecutionConfig;
}

/**
 * Filter configuration options
 */
export interface FilterConfig {
  checkMintable: boolean;
  checkBurned: boolean;
  checkFreezable: boolean;
  checkKeyword: boolean;
  keyword?: string;
  checkMarketCap: boolean;
  minMarketCap?: number;
  maxMarketCap?: number;
  checkLiquidity: boolean;
  minLiquidity?: number;
  maxLiquidity?: number;
}

/**
 * Transaction execution method configuration
 */
export interface ExecutionConfig {
  method: ExecutionMethod;
  jito?: JitoConfig;
  nextBlock?: NextBlockConfig;
  bloxRoute?: BloxRouteConfig;
}

/**
 * Available execution methods
 */
export enum ExecutionMethod {
  STANDARD = 'standard',
  JITO = 'jito',
  NEXTBLOCK = 'nextblock',
  BLOXROUTE = 'bloxroute',
}

/**
 * Jito execution configuration
 */
export interface JitoConfig {
  enabled: boolean;
  fee: number;
}

/**
 * NextBlock execution configuration
 */
export interface NextBlockConfig {
  enabled: boolean;
  apiKey: string;
  fee: number;
}

/**
 * BloxRoute execution configuration
 */
export interface BloxRouteConfig {
  enabled: boolean;
  authHeader: string;
  fee: number;
}

/**
 * Pool information from transaction
 */
export interface PoolInfo {
  poolId: string;
  poolState: any;
  tokenMint: PublicKey;
  transactionSignature: string;
}

/**
 * Token filter result
 */
export interface FilterResult {
  passed: boolean;
  reason?: string;
}

/**
 * Swap execution result
 */
export interface SwapResult {
  success: boolean;
  signature?: string;
  error?: string;
}

/**
 * Market data for a token
 */
export interface MarketData {
  marketCap: number | null;
  liquidity: number | null;
  price: number | null;
}

/**
 * Token metadata
 */
export interface TokenMetadata {
  symbol: string;
  name: string;
  uri: string;
}

/**
 * Application context containing initialized connections and wallets
 */
export interface AppContext {
  connection: Connection;
  keypair: Keypair;
  secondWallet: PublicKey;
  config: SniperConfig;
}

