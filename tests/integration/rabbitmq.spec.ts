import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as amqp from 'amqp-connection-manager';
import { QueueService } from '../../src/queue.service';
import { QueueRegistry } from '../../src/queue.registry';
import { Channel, Consume, QueueMessage } from '../../src/queue.decorator';
import { wait } from '../helpers/test-helpers';

// These tests require RabbitMQ running on localhost:5672
// Run: docker-compose -f tests/docker-compose.yml up -d rabbitmq

const RABBITMQ_URL =
    process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const TEST_TIMEOUT = 30000; // 30 seconds

describe('RabbitMQ Integration Tests', () => {
    let connection: any;
    let channel: any;

    beforeAll(async () => {
        // Connect to RabbitMQ
        connection = amqp.connect(RABBITMQ_URL);

        await new Promise((resolve, reject) => {
            connection.on('connect', resolve);
            connection.on('disconnect', reject);
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });

        channel = connection.createChannel({
            json: true,
            setup: async (ch: any) => {
                // Channel setup if needed
            },
        });

        await channel.waitForConnect();
    }, TEST_TIMEOUT);

    afterAll(async () => {
        if (channel) await channel.close();
        if (connection) await connection.close();
    });

    beforeEach(() => {
        QueueRegistry.clear();
    });

    describe('Queue Creation', () => {
        it('should create a queue', async () => {
            const queueName = 'test-queue-create';

            await channel.assertQueue(queueName, { durable: false });

            // Verify queue exists by checking queue
            const info = await channel.checkQueue(queueName);
            expect(info.queue).toBe(queueName);

            // Cleanup
            await channel.deleteQueue(queueName);
        });

        it('should create durable queue', async () => {
            const queueName = 'test-queue-durable';

            await channel.assertQueue(queueName, { durable: true });

            const info = await channel.checkQueue(queueName);
            expect(info.queue).toBe(queueName);

            await channel.deleteQueue(queueName);
        });

        it('should create exclusive queue', async () => {
            const queueName = '';

            const result = await channel.assertQueue(queueName, {
                exclusive: true,
                autoDelete: true,
            });

            expect(result.queue).toBeDefined();
            // Exclusive queues auto-delete when connection closes
        });
    });

    describe('Message Publishing and Consumption', () => {
        it(
            'should publish and consume message',
            async () => {
                const queueName = 'test-queue-pubsub';
                const message = { task: 'test-task', data: 'test-data' };

                await channel.assertQueue(queueName, { durable: false });

                // Publish message
                await channel.sendToQueue(queueName, message);

                // Consume message
                const receivedMessage = await new Promise(resolve => {
                    channel.consume(queueName, (msg: any) => {
                        if (msg) {
                            const content = JSON.parse(msg.content.toString());
                            channel.ack(msg);
                            resolve(content);
                        }
                    });
                });

                expect(receivedMessage).toEqual(message);

                await channel.deleteQueue(queueName);
            },
            TEST_TIMEOUT,
        );

        it(
            'should handle multiple messages',
            async () => {
                const queueName = 'test-queue-multiple';
                const messages = [
                    { id: 1, data: 'first' },
                    { id: 2, data: 'second' },
                    { id: 3, data: 'third' },
                ];

                await channel.assertQueue(queueName, { durable: false });

                // Publish all messages
                for (const msg of messages) {
                    await channel.sendToQueue(queueName, msg);
                }

                // Consume all messages
                const received: any[] = [];
                await new Promise(resolve => {
                    channel.consume(queueName, (msg: any) => {
                        if (msg) {
                            const content = JSON.parse(msg.content.toString());
                            received.push(content);
                            channel.ack(msg);

                            if (received.length === messages.length) {
                                resolve(null);
                            }
                        }
                    });
                });

                expect(received).toHaveLength(3);
                expect(received).toEqual(expect.arrayContaining(messages));

                await channel.deleteQueue(queueName);
            },
            TEST_TIMEOUT,
        );

        it(
            'should preserve message order in queue',
            async () => {
                const queueName = 'test-queue-order';
                const messages = [1, 2, 3, 4, 5];

                await channel.assertQueue(queueName, { durable: false });

                // Publish in order
                for (const num of messages) {
                    await channel.sendToQueue(queueName, { num });
                }

                // Consume in order
                const received: number[] = [];
                await new Promise(resolve => {
                    channel.consume(queueName, (msg: any) => {
                        if (msg) {
                            const content = JSON.parse(msg.content.toString());
                            received.push(content.num);
                            channel.ack(msg);

                            if (received.length === messages.length) {
                                resolve(null);
                            }
                        }
                    });
                });

                expect(received).toEqual(messages);

                await channel.deleteQueue(queueName);
            },
            TEST_TIMEOUT,
        );
    });

    describe('Message Acknowledgment', () => {
        it('should acknowledge message and remove from queue', async () => {
            const queueName = 'test-queue-ack';

            await channel.assertQueue(queueName, { durable: false });
            await channel.sendToQueue(queueName, { data: 'test' });

            await new Promise(resolve => {
                channel.consume(queueName, (msg: any) => {
                    if (msg) {
                        channel.ack(msg);
                        resolve(null);
                    }
                });
            });

            // Verify queue is empty
            const info = await channel.checkQueue(queueName);
            expect(info.messageCount).toBe(0);

            await channel.deleteQueue(queueName);
        });

        it(
            'should requeue message on nack',
            async () => {
                const queueName = 'test-queue-nack';
                let attemptCount = 0;

                await channel.assertQueue(queueName, { durable: false });
                await channel.sendToQueue(queueName, { data: 'test' });

                await new Promise(resolve => {
                    channel.consume(queueName, (msg: any) => {
                        if (msg) {
                            attemptCount++;

                            if (attemptCount === 1) {
                                // First attempt: nack with requeue
                                channel.nack(msg, false, true);
                            } else {
                                // Second attempt: ack
                                channel.ack(msg);
                                resolve(null);
                            }
                        }
                    });
                });

                expect(attemptCount).toBe(2);

                await channel.deleteQueue(queueName);
            },
            TEST_TIMEOUT,
        );
    });

    describe('Priority Queues', () => {
        it(
            'should process high priority messages first',
            async () => {
                const queueName = 'test-queue-priority';

                await channel.assertQueue(queueName, {
                    durable: false,
                    maxPriority: 10,
                });

                // Send messages with different priorities
                await channel.sendToQueue(
                    queueName,
                    { msg: 'low' },
                    { priority: 1 },
                );
                await channel.sendToQueue(
                    queueName,
                    { msg: 'high' },
                    { priority: 9 },
                );
                await channel.sendToQueue(
                    queueName,
                    { msg: 'medium' },
                    { priority: 5 },
                );

                await wait(100); // Let RabbitMQ reorder

                // Consume and verify order
                const received: string[] = [];
                await new Promise(resolve => {
                    channel.consume(queueName, (msg: any) => {
                        if (msg) {
                            const content = JSON.parse(msg.content.toString());
                            received.push(content.msg);
                            channel.ack(msg);

                            if (received.length === 3) {
                                resolve(null);
                            }
                        }
                    });
                });

                expect(received[0]).toBe('high');
                expect(received[2]).toBe('low');

                await channel.deleteQueue(queueName);
            },
            TEST_TIMEOUT,
        );
    });

    describe('Pub/Sub with Exchanges', () => {
        it('should broadcast message to multiple queues', async () => {
            const exchangeName = 'test-exchange-fanout';
            const queue1 = 'test-queue-sub1';
            const queue2 = 'test-queue-sub2';
            const message = { event: 'user.created', userId: 123 };

            // Setup exchange and queues
            await channel.assertExchange(exchangeName, 'fanout', {
                durable: false,
            });
            await channel.assertQueue(queue1, { durable: false });
            await channel.assertQueue(queue2, { durable: false });
            await channel.bindQueue(queue1, exchangeName, '');
            await channel.bindQueue(queue2, exchangeName, '');

            // Publish to exchange
            channel.publish(
                exchangeName,
                '',
                Buffer.from(JSON.stringify(message)),
            );

            await wait(100);

            // Both queues should receive the message
            const info1 = await channel.checkQueue(queue1);
            const info2 = await channel.checkQueue(queue2);

            expect(info1.messageCount).toBe(1);
            expect(info2.messageCount).toBe(1);

            // Cleanup
            await channel.deleteQueue(queue1);
            await channel.deleteQueue(queue2);
            await channel.deleteExchange(exchangeName);
        });

        it('should route messages by topic pattern', async () => {
            const exchangeName = 'test-exchange-topic';
            const queueUser = 'test-queue-user-events';
            const queueOrder = 'test-queue-order-events';

            await channel.assertExchange(exchangeName, 'topic', {
                durable: false,
            });
            await channel.assertQueue(queueUser, { durable: false });
            await channel.assertQueue(queueOrder, { durable: false });

            await channel.bindQueue(queueUser, exchangeName, 'user.*');
            await channel.bindQueue(queueOrder, exchangeName, 'order.*');

            // Publish different events
            channel.publish(
                exchangeName,
                'user.created',
                Buffer.from(JSON.stringify({ type: 'user' })),
            );
            channel.publish(
                exchangeName,
                'order.placed',
                Buffer.from(JSON.stringify({ type: 'order' })),
            );

            await wait(100);

            const infoUser = await channel.checkQueue(queueUser);
            const infoOrder = await channel.checkQueue(queueOrder);

            expect(infoUser.messageCount).toBe(1);
            expect(infoOrder.messageCount).toBe(1);

            // Cleanup
            await channel.deleteQueue(queueUser);
            await channel.deleteQueue(queueOrder);
            await channel.deleteExchange(exchangeName);
        });
    });

    describe('Message TTL and Expiration', () => {
        it(
            'should expire message after TTL',
            async () => {
                const queueName = 'test-queue-ttl';

                await channel.assertQueue(queueName, {
                    durable: false,
                    messageTtl: 1000, // 1 second
                });

                await channel.sendToQueue(queueName, { data: 'expires' });

                // Wait for expiration
                await wait(1500);

                const info = await channel.checkQueue(queueName);
                expect(info.messageCount).toBe(0);

                await channel.deleteQueue(queueName);
            },
            TEST_TIMEOUT,
        );
    });

    describe('Dead Letter Exchange', () => {
        it(
            'should route rejected messages to DLX',
            async () => {
                const mainQueue = 'test-queue-main';
                const dlxExchange = 'test-dlx';
                const dlQueue = 'test-queue-dlq';

                // Setup DLX
                await channel.assertExchange(dlxExchange, 'fanout', {
                    durable: false,
                });
                await channel.assertQueue(dlQueue, { durable: false });
                await channel.bindQueue(dlQueue, dlxExchange, '');

                // Setup main queue with DLX
                await channel.assertQueue(mainQueue, {
                    durable: false,
                    deadLetterExchange: dlxExchange,
                });

                await channel.sendToQueue(mainQueue, { data: 'will-fail' });

                // Consume and reject without requeue
                await new Promise(resolve => {
                    channel.consume(mainQueue, (msg: any) => {
                        if (msg) {
                            channel.nack(msg, false, false); // Don't requeue
                            resolve(null);
                        }
                    });
                });

                await wait(100);

                // Check DLQ has the message
                const dlqInfo = await channel.checkQueue(dlQueue);
                expect(dlqInfo.messageCount).toBe(1);

                // Cleanup
                await channel.deleteQueue(mainQueue);
                await channel.deleteQueue(dlQueue);
                await channel.deleteExchange(dlxExchange);
            },
            TEST_TIMEOUT,
        );
    });

    describe('Connection Recovery', () => {
        it(
            'should handle temporary disconnection',
            async () => {
                const queueName = 'test-queue-recovery';

                await channel.assertQueue(queueName, { durable: false });

                // Simulate connection issue by closing and reconnecting
                await channel.close();

                channel = connection.createChannel({
                    json: true,
                    setup: async (ch: any) => {
                        await ch.assertQueue(queueName, { durable: false });
                    },
                });

                await channel.waitForConnect();

                // Should be able to use queue
                await channel.sendToQueue(queueName, { recovered: true });

                const info = await channel.checkQueue(queueName);
                expect(info.messageCount).toBe(1);

                await channel.deleteQueue(queueName);
            },
            TEST_TIMEOUT,
        );
    });

    describe('Large Messages', () => {
        it(
            'should handle large message payloads',
            async () => {
                const queueName = 'test-queue-large';
                const largeData = 'x'.repeat(100000); // 100KB string
                const message = { data: largeData };

                await channel.assertQueue(queueName, { durable: false });
                await channel.sendToQueue(queueName, message);

                const received = await new Promise(resolve => {
                    channel.consume(queueName, (msg: any) => {
                        if (msg) {
                            const content = JSON.parse(msg.content.toString());
                            channel.ack(msg);
                            resolve(content);
                        }
                    });
                });

                expect(received).toEqual(message);

                await channel.deleteQueue(queueName);
            },
            TEST_TIMEOUT,
        );
    });

    describe('Prefetch Limit', () => {
        it(
            'should limit concurrent message processing',
            async () => {
                const queueName = 'test-queue-prefetch';
                const prefetchCount = 2;

                await channel.assertQueue(queueName, { durable: false });
                await channel.prefetch(prefetchCount);

                // Send 5 messages
                for (let i = 0; i < 5; i++) {
                    await channel.sendToQueue(queueName, { num: i });
                }

                let inFlight = 0;
                let maxInFlight = 0;

                await new Promise(resolve => {
                    let processed = 0;
                    channel.consume(queueName, async (msg: any) => {
                        if (msg) {
                            inFlight++;
                            maxInFlight = Math.max(maxInFlight, inFlight);

                            await wait(50); // Simulate processing

                            inFlight--;
                            channel.ack(msg);
                            processed++;

                            if (processed === 5) {
                                resolve(null);
                            }
                        }
                    });
                });

                // Max in-flight should respect prefetch
                expect(maxInFlight).toBeLessThanOrEqual(prefetchCount);

                await channel.deleteQueue(queueName);
            },
            TEST_TIMEOUT,
        );
    });
});
