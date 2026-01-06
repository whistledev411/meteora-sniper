/**
 * Meteora Sniper Bot
 * 
 * Main entry point for the application
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { logger } from './utils/logger';
import { loadConfig } from './config/config.service';
import { SniperService } from './services/sniper.service';
import { AppContext } from './types';
import { startSolPricePolling } from './handleSolPrice';
import { ConfigurationError, ConnectionError } from './errors';

/**
 * Initializes the application context
 */
function initializeContext(): AppContext {
  const config = loadConfig();
  
  const connection = new Connection(config.rpcEndpoint, 'processed');
  const keypair = Keypair.fromSecretKey(bs58.decode(config.privateKey));
  const secondWallet = new PublicKey(config.secondWallet);

  return {
    connection,
    keypair,
    secondWallet,
    config,
  };
}

/**
 * Validates the application can start
 */
async function validateStartup(context: AppContext): Promise<void> {
  try {
    // Check RPC connection
    const version = await context.connection.getVersion();
    logger.info({ version }, 'RPC connection validated');

    // Check wallet balance
    const balance = await context.connection.getBalance(context.keypair.publicKey);
    const solBalance = balance / 1_000_000_000;
    
    if (solBalance < context.config.buyAmount + 0.1) {
      logger.warn(
        { balance: solBalance, required: context.config.buyAmount + 0.1 },
        'Wallet balance may be insufficient for trading'
      );
    } else {
      logger.info({ balance: solBalance }, 'Wallet balance validated');
    }

    // Validate second wallet
    try {
      await context.connection.getAccountInfo(context.secondWallet);
      logger.info({ wallet: context.secondWallet.toBase58() }, 'Second wallet validated');
    } catch (error) {
      logger.warn(
        { wallet: context.secondWallet.toBase58() },
        'Second wallet may not exist (will be created if needed)'
      );
    }
  } catch (error) {
    throw new ConnectionError(
      `Startup validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      context.config.rpcEndpoint
    );
  }
}

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    logger.info('=== Meteora Sniper Bot Starting ===');
    
    // Initialize context
    const context = initializeContext();
    logger.info({
      executionMethod: context.config.execution.method,
      buyAmount: context.config.buyAmount,
      filters: {
        mintable: context.config.filters.checkMintable,
        burned: context.config.filters.checkBurned,
        freezable: context.config.filters.checkFreezable,
        keyword: context.config.filters.checkKeyword,
        marketCap: context.config.filters.checkMarketCap,
        liquidity: context.config.filters.checkLiquidity,
      },
    }, 'Configuration loaded');

    // Validate startup
    await validateStartup(context);

    // Start SOL price polling
    startSolPricePolling();
    logger.info('SOL price polling started');

    // Create and start sniper service
    const sniperService = new SniperService(context);
    await sniperService.start();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      sniperService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      sniperService.stop();
      process.exit(0);
    });

    logger.info('=== Meteora Sniper Bot Running ===');
  } catch (error) {
    if (error instanceof ConfigurationError) {
      logger.error({ error: error.message, field: error.field }, 'Configuration error');
      process.exit(1);
    } else if (error instanceof ConnectionError) {
      logger.error({ error: error.message, endpoint: error.endpoint }, 'Connection error');
      process.exit(1);
    } else {
      logger.error({ error }, 'Unhandled error in main');
      process.exit(1);
    }
  }
}

// Start the application
main().catch((err) => {
  logger.fatal({ err }, 'Fatal error during startup');
  process.exit(1);
});
