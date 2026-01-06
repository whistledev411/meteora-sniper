/**
 * Configuration Service
 * 
 * Centralized configuration management with validation
 */

import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { SniperConfig, FilterConfig, ExecutionConfig, ExecutionMethod } from '../types';
import { ConfigurationError } from '../errors';

dotenv.config();

/**
 * Retrieves and validates an environment variable
 */
function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new ConfigurationError(`Required environment variable ${name} is not set`, name);
  }
  return value || '';
}

/**
 * Retrieves a boolean environment variable
 */
function getBooleanEnvVar(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Retrieves a number environment variable
 */
function getNumberEnvVar(name: string, required: boolean = true, defaultValue?: number): number {
  const value = process.env[name];
  if (!value) {
    if (required) {
      throw new ConfigurationError(`Required environment variable ${name} is not set`, name);
    }
    return defaultValue || 0;
  }
  const num = Number(value);
  if (isNaN(num)) {
    throw new ConfigurationError(`Invalid number value for ${name}: ${value}`, name);
  }
  return num;
}

/**
 * Validates the configuration
 */
function validateConfig(config: SniperConfig): void {
  // Validate wallet configuration
  if (!config.privateKey || config.privateKey.length < 32) {
    throw new ConfigurationError('Invalid private key format');
  }
  
  try {
    new (require('@solana/web3.js').PublicKey)(config.secondWallet);
  } catch {
    throw new ConfigurationError('Invalid second wallet address');
  }
  
  // Validate trading amounts
  if (config.buyAmount <= 0) {
    throw new ConfigurationError('Buy amount must be greater than 0');
  }
  
  if (config.slippage < 0 || config.slippage > 100) {
    throw new ConfigurationError('Slippage must be between 0 and 100');
  }
  
  // Validate filter ranges
  if (config.filters.checkMarketCap) {
    if (config.filters.minMarketCap! < 0 || config.filters.maxMarketCap! < 0) {
      throw new ConfigurationError('Market cap values must be positive');
    }
    if (config.filters.minMarketCap! >= config.filters.maxMarketCap!) {
      throw new ConfigurationError('Minimum market cap must be less than maximum');
    }
  }
  
  if (config.filters.checkLiquidity) {
    if (config.filters.minLiquidity! < 0 || config.filters.maxLiquidity! < 0) {
      throw new ConfigurationError('Liquidity values must be positive');
    }
    if (config.filters.minLiquidity! >= config.filters.maxLiquidity!) {
      throw new ConfigurationError('Minimum liquidity must be less than maximum');
    }
  }
  
  // Validate execution method
  const enabledMethods = [
    config.execution.jito?.enabled,
    config.execution.nextBlock?.enabled,
    config.execution.bloxRoute?.enabled,
  ].filter(Boolean).length;
  
  if (enabledMethods > 1) {
    throw new ConfigurationError('Only one execution method can be enabled at a time');
  }
  
  if (config.execution.method === ExecutionMethod.NEXTBLOCK && !config.execution.nextBlock?.apiKey) {
    throw new ConfigurationError('NextBlock API key is required when NextBlock mode is enabled');
  }
  
  if (config.execution.method === ExecutionMethod.BLOXROUTE && !config.execution.bloxRoute?.authHeader) {
    throw new ConfigurationError('BloxRoute auth header is required when BloxRoute mode is enabled');
  }
}

/**
 * Loads and validates configuration from environment variables
 */
export function loadConfig(): SniperConfig {
  try {
    const filters: FilterConfig = {
      checkMintable: getBooleanEnvVar('CHECK_IF_MINT_IS_MINTABLE', false),
      checkBurned: getBooleanEnvVar('CHECK_IF_MINT_IS_BURNED', false),
      checkFreezable: getBooleanEnvVar('CHECK_IF_MINT_IS_FREEZABLE', false),
      checkKeyword: getBooleanEnvVar('CHECK_KEYWORD', false),
      keyword: getEnvVar('KEYWORD', false) || undefined,
      checkMarketCap: getBooleanEnvVar('CHECK_MARKET_CAP', false),
      minMarketCap: getNumberEnvVar('MINIMUM_MARKET_CAP', false),
      maxMarketCap: getNumberEnvVar('MAXIMUM_MARKET_CAP', false),
      checkLiquidity: getBooleanEnvVar('CHECK_LIQUIDITY', false),
      minLiquidity: getNumberEnvVar('MINIMUM_LIQUIDITY', false),
      maxLiquidity: getNumberEnvVar('MAXIMUM_LIQUIDITY', false),
    };
    
    const jitoEnabled = getBooleanEnvVar('JITO_MODE', false);
    const nextBlockEnabled = getBooleanEnvVar('NEXTBLOCK_MODE', false);
    const bloxRouteEnabled = getBooleanEnvVar('BLOXROUTE_MODE', false);
    
    let executionMethod = ExecutionMethod.STANDARD;
    if (jitoEnabled) executionMethod = ExecutionMethod.JITO;
    else if (nextBlockEnabled) executionMethod = ExecutionMethod.NEXTBLOCK;
    else if (bloxRouteEnabled) executionMethod = ExecutionMethod.BLOXROUTE;
    
    const execution: ExecutionConfig = {
      method: executionMethod,
      jito: {
        enabled: jitoEnabled,
        fee: getNumberEnvVar('JITO_FEE', false, 0.001),
      },
      nextBlock: {
        enabled: nextBlockEnabled,
        apiKey: getEnvVar('NEXT_BLOCK_API', false),
        fee: getNumberEnvVar('NEXT_BLOCK_FEE', false, 0.001),
      },
      bloxRoute: {
        enabled: bloxRouteEnabled,
        authHeader: getEnvVar('BLOXROUTE_AUTH_HEADER', false),
        fee: getNumberEnvVar('BLOXROUTE_FEE', false, 0.001),
      },
    };
    
    const config: SniperConfig = {
      privateKey: getEnvVar('PRIVATE_KEY'),
      secondWallet: getEnvVar('SECOND_WALLET'),
      rpcEndpoint: getEnvVar('RPC_ENDPOINT'),
      rpcWebsocketEndpoint: getEnvVar('RPC_WEBSOCKET_ENDPOINT', false) || undefined,
      grpcEndpoint: getEnvVar('GRPC_ENDPOINT'),
      grpcToken: getEnvVar('GRPC_TOKEN'),
      buyAmount: getNumberEnvVar('BUY_AMOUNT'),
      slippage: getNumberEnvVar('SLIPPAGE', false, 5),
      priorityFee: getNumberEnvVar('PRIORITY_FEE', false, 0.001),
      filters,
      execution,
    };
    
    validateConfig(config);
    
    logger.info('Configuration loaded and validated successfully');
    return config;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      logger.error({ error, field: error.field }, 'Configuration error');
      throw error;
    }
    logger.error({ error }, 'Failed to load configuration');
    throw new ConfigurationError(`Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

