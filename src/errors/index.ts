/**
 * Custom error classes for the Meteora Sniper Bot
 */

/**
 * Base error class for all application errors
 */
export class SniperError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration-related errors
 */
export class ConfigurationError extends SniperError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'CONFIG_ERROR');
    this.field = field;
  }
}

/**
 * RPC/Connection-related errors
 */
export class ConnectionError extends SniperError {
  constructor(message: string, public readonly endpoint?: string) {
    super(message, 'CONNECTION_ERROR');
    this.endpoint = endpoint;
  }
}

/**
 * Transaction execution errors
 */
export class TransactionError extends SniperError {
  constructor(
    message: string,
    public readonly signature?: string,
    public readonly reason?: string
  ) {
    super(message, 'TRANSACTION_ERROR');
    this.signature = signature;
    this.reason = reason;
  }
}

/**
 * Pool-related errors
 */
export class PoolError extends SniperError {
  constructor(message: string, public readonly poolId?: string) {
    super(message, 'POOL_ERROR');
    this.poolId = poolId;
  }
}

/**
 * Filter validation errors
 */
export class FilterError extends SniperError {
  constructor(message: string, public readonly filterType?: string) {
    super(message, 'FILTER_ERROR');
    this.filterType = filterType;
  }
}

