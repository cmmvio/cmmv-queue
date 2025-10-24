import { Logger } from '@cmmv/core';
import { SynapConfig } from './queue.interface';

// Dynamic import for Synap to handle optional dependency
let Synap: any;
try {
    Synap = require('@hivellm/synap').Synap;
} catch (e) {
    // Synap not installed, will be handled at runtime
}

/**
 * Synap Queue Adapter
 *
 * Provides integration with Synap high-performance queue system.
 * Supports both queue-based (point-to-point) and pub/sub (broadcast) messaging.
 */
export class SynapAdapter {
    private client: any; // Synap client instance
    private logger: Logger;
    private activeConsumers: Map<string, NodeJS.Timeout> = new Map();
    private pollingInterval: number;
    private concurrency: number;

    constructor(url: string, config: SynapConfig = {}, logger: Logger) {
        this.logger = logger;
        this.pollingInterval = config.pollingInterval || 1000;
        this.concurrency = config.concurrency || 5;

        this.client = new Synap({
            url,
            timeout: config.timeout || 10000,
            debug: config.debug || false,
            auth: config.auth,
        });

        this.logger.log('Synap client initialized');
    }

    /**
     * Create a queue in Synap
     */
    async createQueue(
        queueName: string,
        options: {
            maxDepth?: number;
            ackDeadlineSecs?: number;
            defaultMaxRetries?: number;
            defaultPriority?: number;
        } = {},
    ): Promise<void> {
        try {
            await this.client.queue.createQueue(queueName, {
                max_depth: options.maxDepth || 10000,
                ack_deadline_secs: options.ackDeadlineSecs || 30,
                default_max_retries: options.defaultMaxRetries || 3,
                default_priority: options.defaultPriority || 5,
            });

            this.logger.log(`Synap queue created: ${queueName}`);
        } catch (error: any) {
            // Queue might already exist, ignore error
            if (!error.message?.includes('already exists')) {
                this.logger.error(
                    `Failed to create Synap queue: ${error.message}`,
                );
            }
        }
    }

    /**
     * Publish message to Synap queue (point-to-point)
     */
    async publishToQueue(
        queueName: string,
        data: any,
        options: { priority?: number; maxRetries?: number } = {},
    ): Promise<boolean> {
        try {
            await this.client.queue.publishJSON(queueName, data, {
                priority: options.priority || 5,
                max_retries: options.maxRetries || 3,
            });

            return true;
        } catch (error: any) {
            this.logger.error(`Synap publish error: ${error.message}`);
            return false;
        }
    }

    /**
     * Publish message to Synap pub/sub (broadcast)
     */
    async publishToPubSub(
        topic: string,
        data: any,
        options: { priority?: number } = {},
    ): Promise<boolean> {
        try {
            await this.client.pubsub.publish(topic, data, {
                priority: options.priority || 5,
            });

            return true;
        } catch (error: any) {
            this.logger.error(`Synap pub/sub publish error: ${error.message}`);
            return false;
        }
    }

    /**
     * Start consuming messages from Synap queue
     */
    startQueueConsumer(
        queueName: string,
        consumerId: string,
        handler: (data: any, messageId: string) => Promise<void>,
    ): void {
        const poll = async () => {
            try {
                const { message, data } = await this.client.queue.consumeJSON(
                    queueName,
                    consumerId,
                );

                if (message && data) {
                    try {
                        await handler(data, message.id);
                        // ACK on success
                        await this.client.queue.ack(queueName, message.id);
                    } catch (error: any) {
                        this.logger.error(`Handler error: ${error.message}`);
                        // NACK on failure (will retry)
                        await this.client.queue.nack(
                            queueName,
                            message.id,
                            true,
                        );
                    }
                }
            } catch (error: any) {
                this.logger.error(`Synap consume error: ${error.message}`);
            }
        };

        // Start polling
        const interval = setInterval(poll, this.pollingInterval);
        this.activeConsumers.set(`${queueName}:${consumerId}`, interval);

        this.logger.log(`Synap consumer started: ${queueName}:${consumerId}`);
    }

    /**
     * Subscribe to Synap pub/sub topic
     */
    subscribeToPubSub(
        topics: string[],
        subscriberId: string,
        handler: (topic: string, data: any) => Promise<void>,
    ): void {
        this.client.pubsub
            .subscribe({
                topics,
                subscriberId,
            })
            .subscribe({
                next: async message => {
                    try {
                        await handler(message.topic, message.data);
                    } catch (error: any) {
                        this.logger.error(
                            `Pub/sub handler error: ${error.message}`,
                        );
                    }
                },
                error: error => {
                    this.logger.error(
                        `Pub/sub subscription error: ${error.message}`,
                    );
                },
            });

        this.logger.log(`Synap pub/sub subscribed: ${topics.join(', ')}`);
    }

    /**
     * Stop a consumer
     */
    stopConsumer(queueName: string, consumerId: string): void {
        const key = `${queueName}:${consumerId}`;
        const interval = this.activeConsumers.get(key);

        if (interval) {
            clearInterval(interval);
            this.activeConsumers.delete(key);
            this.logger.log(`Synap consumer stopped: ${key}`);
        }
    }

    /**
     * Stop all consumers and disconnect
     */
    async shutdown(): Promise<void> {
        // Stop all polling consumers
        for (const [key, interval] of this.activeConsumers.entries()) {
            clearInterval(interval);
            this.logger.log(`Stopped consumer: ${key}`);
        }

        this.activeConsumers.clear();

        // Close Synap connection
        try {
            await this.client.close?.();
            this.logger.log('Synap connection closed');
        } catch (error: any) {
            this.logger.error(`Synap shutdown error: ${error.message}`);
        }
    }

    /**
     * Get the underlying Synap client
     */
    getClient(): any {
        return this.client;
    }
}
