/**
 * Stream Service
 * 
 * Handles Yellowstone Geyser gRPC stream management
 */

import Client, {
  CommitmentLevel,
  SubscribeRequest,
  SubscribeUpdate,
} from '@triton-one/yellowstone-grpc';
import { ClientDuplexStream } from '@grpc/grpc-js';
import { logger } from '../utils/logger';
import { ConnectionError } from '../errors';
import { METEORA_PROGRAMS } from '../config/constants';

/**
 * Service for managing the Yellowstone Geyser stream
 */
export class StreamService {
  private client: Client | null = null;
  private stream: ClientDuplexStream<SubscribeRequest, SubscribeUpdate> | null = null;

  /**
   * Creates a subscribe request for Meteora pools
   */
  private createSubscribeRequest(): SubscribeRequest {
    return {
      accounts: {},
      slots: {},
      transactions: {
        meteora: {
          vote: false,
          failed: false,
          signature: undefined,
          accountInclude: [
            METEORA_PROGRAMS.AMM.toBase58(),
            METEORA_PROGRAMS.VAULT.toBase58(),
          ],
          accountExclude: [],
          accountRequired: [],
        },
      },
      transactionsStatus: {},
      entry: {},
      blocks: {},
      blocksMeta: {},
      accountsDataSlice: [],
      ping: undefined,
      commitment: CommitmentLevel.PROCESSED,
    };
  }

  /**
   * Sends a subscribe request to the stream
   */
  private async sendSubscribeRequest(
    stream: ClientDuplexStream<SubscribeRequest, SubscribeUpdate>,
    request: SubscribeRequest
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      stream.write(request, (err: Error | null) => {
        if (err) {
          reject(new ConnectionError(`Failed to send subscribe request: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Connects to the Geyser stream
   * @param grpcEndpoint - GRPC endpoint URL
   * @param grpcToken - Authentication token
   */
  async connect(grpcEndpoint: string, grpcToken: string): Promise<void> {
    try {
      this.client = new Client(grpcEndpoint, grpcToken, undefined);
      this.stream = await this.client.subscribe();
      const request = this.createSubscribeRequest();
      await this.sendSubscribeRequest(this.stream, request);
      
      logger.info('Geyser connection established - watching new Meteora pools');
    } catch (error) {
      logger.error({ error, grpcEndpoint }, 'Failed to connect to Geyser stream');
      throw new ConnectionError(
        `Failed to connect to Geyser: ${error instanceof Error ? error.message : 'Unknown error'}`,
        grpcEndpoint
      );
    }
  }

  /**
   * Starts listening to stream events
   * @param onData - Callback for data events
   */
  async listen(
    onData: (data: SubscribeUpdate) => Promise<void>
  ): Promise<void> {
    if (!this.stream) {
      throw new ConnectionError('Stream not connected. Call connect() first.');
    }

    return new Promise<void>((resolve, reject) => {
      this.stream!.on('data', async (data: SubscribeUpdate) => {
        try {
          await onData(data);
        } catch (error) {
          logger.error({ error }, 'Error handling stream data');
          // Don't reject, just log the error and continue
        }
      });

      this.stream!.on('error', (error: Error) => {
        logger.error({ error }, 'Stream error');
        reject(new ConnectionError(`Stream error: ${error.message}`));
        this.disconnect();
      });

      this.stream!.on('end', () => {
        logger.info('Stream ended');
        resolve();
      });

      this.stream!.on('close', () => {
        logger.info('Stream closed');
        resolve();
      });
    });
  }

  /**
   * Disconnects from the stream
   */
  disconnect(): void {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
    if (this.client) {
      this.client = null;
    }
    logger.info('Disconnected from Geyser stream');
  }
}

