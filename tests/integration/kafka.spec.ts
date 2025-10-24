import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Kafka, Producer, Consumer, Admin } from 'kafkajs';
import { wait } from '../helpers/test-helpers';

// These tests require Kafka running on localhost:9092
// Run: docker-compose -f tests/docker-compose.yml up -d kafka

const KAFKA_BROKERS = process.env.KAFKA_URL?.split(',') || ['localhost:9092'];
const TEST_TIMEOUT = 30000; // 30 seconds

describe('Kafka Integration Tests', () => {
    let kafka: Kafka;
    let producer: Producer;
    let admin: Admin;

    beforeAll(async () => {
        kafka = new Kafka({
            clientId: 'cmmv-queue-test',
            brokers: KAFKA_BROKERS,
            retry: {
                retries: 5,
                initialRetryTime: 300,
            },
        });

        producer = kafka.producer();
        admin = kafka.admin();

        await producer.connect();
        await admin.connect();
    }, TEST_TIMEOUT);

    afterAll(async () => {
        await producer.disconnect();
        await admin.disconnect();
    });

    beforeEach(async () => {
        // Clean up topics if needed
    });

    describe('Topic Management', () => {
        it('should create a topic', async () => {
            const topicName = `test-topic-create-${Date.now()}`;

            await admin.createTopics({
                topics: [
                    {
                        topic: topicName,
                        numPartitions: 1,
                        replicationFactor: 1,
                    },
                ],
            });

            const topics = await admin.listTopics();
            expect(topics).toContain(topicName);

            // Cleanup
            await admin.deleteTopics({ topics: [topicName] });
        });

        it('should create topic with multiple partitions', async () => {
            const topicName = `test-topic-partitions-${Date.now()}`;

            await admin.createTopics({
                topics: [
                    {
                        topic: topicName,
                        numPartitions: 3,
                        replicationFactor: 1,
                    },
                ],
            });

            const metadata = await admin.fetchTopicMetadata({
                topics: [topicName],
            });
            const topic = metadata.topics.find(t => t.name === topicName);

            expect(topic?.partitions).toHaveLength(3);

            await admin.deleteTopics({ topics: [topicName] });
        });
    });

    describe('Message Production', () => {
        it(
            'should produce message to topic',
            async () => {
                const topicName = `test-topic-produce-${Date.now()}`;
                const message = { key: 'test-key', value: 'test-value' };

                await admin.createTopics({
                    topics: [{ topic: topicName, numPartitions: 1 }],
                });

                await producer.send({
                    topic: topicName,
                    messages: [
                        {
                            key: message.key,
                            value: JSON.stringify(message),
                        },
                    ],
                });

                // Create consumer to verify
                const consumer = kafka.consumer({
                    groupId: 'test-group-verify',
                });
                await consumer.connect();
                await consumer.subscribe({
                    topic: topicName,
                    fromBeginning: true,
                });

                const receivedMessage = await new Promise(resolve => {
                    consumer.run({
                        eachMessage: async ({ message }) => {
                            const value = JSON.parse(message.value!.toString());
                            resolve(value);
                        },
                    });
                });

                expect(receivedMessage).toEqual(message);

                await consumer.disconnect();
                await admin.deleteTopics({ topics: [topicName] });
            },
            TEST_TIMEOUT,
        );

        it(
            'should produce batch of messages',
            async () => {
                const topicName = `test-topic-batch-${Date.now()}`;
                const messages = Array.from({ length: 10 }, (_, i) => ({
                    key: `key-${i}`,
                    value: JSON.stringify({ id: i, data: `message-${i}` }),
                }));

                await admin.createTopics({
                    topics: [{ topic: topicName, numPartitions: 1 }],
                });

                await producer.send({
                    topic: topicName,
                    messages,
                });

                // Verify all messages received
                const consumer = kafka.consumer({
                    groupId: 'test-group-batch',
                });
                await consumer.connect();
                await consumer.subscribe({
                    topic: topicName,
                    fromBeginning: true,
                });

                const received: any[] = [];
                await new Promise(resolve => {
                    consumer.run({
                        eachMessage: async ({ message }) => {
                            const value = JSON.parse(message.value!.toString());
                            received.push(value);

                            if (received.length === 10) {
                                resolve(null);
                            }
                        },
                    });
                });

                expect(received).toHaveLength(10);

                await consumer.disconnect();
                await admin.deleteTopics({ topics: [topicName] });
            },
            TEST_TIMEOUT,
        );

        it(
            'should handle large messages',
            async () => {
                const topicName = `test-topic-large-${Date.now()}`;
                const largeData = 'x'.repeat(100000); // 100KB
                const message = { data: largeData };

                await admin.createTopics({
                    topics: [{ topic: topicName, numPartitions: 1 }],
                });

                await producer.send({
                    topic: topicName,
                    messages: [
                        {
                            value: JSON.stringify(message),
                        },
                    ],
                });

                const consumer = kafka.consumer({
                    groupId: 'test-group-large',
                });
                await consumer.connect();
                await consumer.subscribe({
                    topic: topicName,
                    fromBeginning: true,
                });

                const received = await new Promise(resolve => {
                    consumer.run({
                        eachMessage: async ({ message: msg }) => {
                            const value = JSON.parse(msg.value!.toString());
                            resolve(value);
                        },
                    });
                });

                expect(received).toEqual(message);

                await consumer.disconnect();
                await admin.deleteTopics({ topics: [topicName] });
            },
            TEST_TIMEOUT,
        );
    });

    describe('Message Consumption', () => {
        it(
            'should consume messages from beginning',
            async () => {
                const topicName = `test-topic-consume-${Date.now()}`;
                const messages = ['msg1', 'msg2', 'msg3'];

                await admin.createTopics({
                    topics: [{ topic: topicName, numPartitions: 1 }],
                });

                // Produce messages first
                await producer.send({
                    topic: topicName,
                    messages: messages.map(msg => ({ value: msg })),
                });

                // Consume from beginning
                const consumer = kafka.consumer({
                    groupId: 'test-group-beginning',
                });
                await consumer.connect();
                await consumer.subscribe({
                    topic: topicName,
                    fromBeginning: true,
                });

                const received: string[] = [];
                await new Promise(resolve => {
                    consumer.run({
                        eachMessage: async ({ message }) => {
                            received.push(message.value!.toString());

                            if (received.length === 3) {
                                resolve(null);
                            }
                        },
                    });
                });

                expect(received).toEqual(messages);

                await consumer.disconnect();
                await admin.deleteTopics({ topics: [topicName] });
            },
            TEST_TIMEOUT,
        );

        it(
            'should consume only new messages',
            async () => {
                const topicName = `test-topic-new-${Date.now()}`;

                await admin.createTopics({
                    topics: [{ topic: topicName, numPartitions: 1 }],
                });

                // Produce old messages
                await producer.send({
                    topic: topicName,
                    messages: [{ value: 'old-1' }, { value: 'old-2' }],
                });

                // Consumer with fromBeginning: false
                const consumer = kafka.consumer({ groupId: 'test-group-new' });
                await consumer.connect();
                await consumer.subscribe({
                    topic: topicName,
                    fromBeginning: false,
                });

                const received: string[] = [];
                const runPromise = consumer.run({
                    eachMessage: async ({ message }) => {
                        received.push(message.value!.toString());
                    },
                });

                await wait(1000); // Wait for consumer to be ready

                // Produce new messages
                await producer.send({
                    topic: topicName,
                    messages: [{ value: 'new-1' }, { value: 'new-2' }],
                });

                await wait(1000);

                expect(received).not.toContain('old-1');
                expect(received).not.toContain('old-2');
                expect(received).toContain('new-1');
                expect(received).toContain('new-2');

                await consumer.disconnect();
                await admin.deleteTopics({ topics: [topicName] });
            },
            TEST_TIMEOUT,
        );
    });

    describe('Consumer Groups', () => {
        it(
            'should distribute messages across consumers in group',
            async () => {
                const topicName = `test-topic-group-${Date.now()}`;
                const groupId = 'test-group-distribute';

                await admin.createTopics({
                    topics: [{ topic: topicName, numPartitions: 2 }],
                });

                // Create two consumers in same group
                const consumer1 = kafka.consumer({ groupId });
                const consumer2 = kafka.consumer({ groupId });

                await consumer1.connect();
                await consumer2.connect();

                await consumer1.subscribe({
                    topic: topicName,
                    fromBeginning: true,
                });
                await consumer2.subscribe({
                    topic: topicName,
                    fromBeginning: true,
                });

                const received1: number[] = [];
                const received2: number[] = [];

                consumer1.run({
                    eachMessage: async ({ message }) => {
                        const value = JSON.parse(message.value!.toString());
                        received1.push(value.id);
                    },
                });

                consumer2.run({
                    eachMessage: async ({ message }) => {
                        const value = JSON.parse(message.value!.toString());
                        received2.push(value.id);
                    },
                });

                await wait(2000); // Wait for consumers to join group

                // Produce messages
                const messages = Array.from({ length: 10 }, (_, i) => ({
                    value: JSON.stringify({ id: i }),
                }));

                await producer.send({ topic: topicName, messages });

                await wait(2000);

                // Both consumers should have received some messages
                expect(received1.length + received2.length).toBe(10);
                expect(received1.length).toBeGreaterThan(0);
                expect(received2.length).toBeGreaterThan(0);

                // No duplicates between consumers
                const allReceived = [...received1, ...received2];
                const unique = new Set(allReceived);
                expect(unique.size).toBe(10);

                await consumer1.disconnect();
                await consumer2.disconnect();
                await admin.deleteTopics({ topics: [topicName] });
            },
            TEST_TIMEOUT,
        );

        it(
            'should rebalance when consumer joins',
            async () => {
                const topicName = `test-topic-rebalance-${Date.now()}`;
                const groupId = 'test-group-rebalance';

                await admin.createTopics({
                    topics: [{ topic: topicName, numPartitions: 3 }],
                });

                // Start with one consumer
                const consumer1 = kafka.consumer({ groupId });
                await consumer1.connect();
                await consumer1.subscribe({ topic: topicName });

                let consumer1Count = 0;
                consumer1.run({
                    eachMessage: async () => {
                        consumer1Count++;
                    },
                });

                await wait(1000);

                // Add second consumer (should trigger rebalance)
                const consumer2 = kafka.consumer({ groupId });
                await consumer2.connect();
                await consumer2.subscribe({ topic: topicName });

                let consumer2Count = 0;
                consumer2.run({
                    eachMessage: async () => {
                        consumer2Count++;
                    },
                });

                await wait(2000); // Wait for rebalance

                // Produce messages
                for (let i = 0; i < 20; i++) {
                    await producer.send({
                        topic: topicName,
                        messages: [{ value: `msg-${i}` }],
                    });
                }

                await wait(2000);

                // Both should have received messages
                expect(consumer1Count + consumer2Count).toBeGreaterThan(0);

                await consumer1.disconnect();
                await consumer2.disconnect();
                await admin.deleteTopics({ topics: [topicName] });
            },
            TEST_TIMEOUT,
        );
    });

    describe('Offset Management', () => {
        it(
            'should commit offsets automatically',
            async () => {
                const topicName = `test-topic-offset-${Date.now()}`;
                const groupId = 'test-group-offset-auto';

                await admin.createTopics({
                    topics: [{ topic: topicName, numPartitions: 1 }],
                });

                // Produce messages
                await producer.send({
                    topic: topicName,
                    messages: [{ value: 'msg1' }, { value: 'msg2' }],
                });

                // Consume and let auto-commit happen
                const consumer = kafka.consumer({
                    groupId,
                    autoCommit: true,
                });

                await consumer.connect();
                await consumer.subscribe({
                    topic: topicName,
                    fromBeginning: true,
                });

                let count = 0;
                await new Promise(resolve => {
                    consumer.run({
                        eachMessage: async () => {
                            count++;
                            if (count === 2) {
                                resolve(null);
                            }
                        },
                    });
                });

                await wait(1000); // Wait for auto-commit
                await consumer.disconnect();

                // Create new consumer with same group - shouldn't re-consume
                const consumer2 = kafka.consumer({ groupId });
                await consumer2.connect();
                await consumer2.subscribe({
                    topic: topicName,
                    fromBeginning: true,
                });

                let recount = 0;
                const timeout = new Promise(resolve =>
                    setTimeout(resolve, 2000),
                );

                await Promise.race([
                    consumer2.run({
                        eachMessage: async () => {
                            recount++;
                        },
                    }),
                    timeout,
                ]);

                expect(recount).toBe(0); // Should not re-consume

                await consumer2.disconnect();
                await admin.deleteTopics({ topics: [topicName] });
            },
            TEST_TIMEOUT,
        );
    });

    describe('Partitions', () => {
        it(
            'should distribute messages across partitions',
            async () => {
                const topicName = `test-topic-partitions-dist-${Date.now()}`;
                const numPartitions = 3;

                await admin.createTopics({
                    topics: [{ topic: topicName, numPartitions }],
                });

                // Produce messages with different keys
                for (let i = 0; i < 15; i++) {
                    await producer.send({
                        topic: topicName,
                        messages: [
                            {
                                key: `key-${i}`,
                                value: `msg-${i}`,
                            },
                        ],
                    });
                }

                const consumer = kafka.consumer({
                    groupId: 'test-group-part-dist',
                });
                await consumer.connect();
                await consumer.subscribe({
                    topic: topicName,
                    fromBeginning: true,
                });

                const partitionCounts = new Map<number, number>();

                await new Promise(resolve => {
                    let count = 0;
                    consumer.run({
                        eachMessage: async ({ partition }) => {
                            partitionCounts.set(
                                partition,
                                (partitionCounts.get(partition) || 0) + 1,
                            );
                            count++;

                            if (count === 15) {
                                resolve(null);
                            }
                        },
                    });
                });

                // Messages should be distributed (not all in one partition)
                expect(partitionCounts.size).toBeGreaterThan(1);

                await consumer.disconnect();
                await admin.deleteTopics({ topics: [topicName] });
            },
            TEST_TIMEOUT,
        );

        it(
            'should maintain order within partition',
            async () => {
                const topicName = `test-topic-order-partition-${Date.now()}`;

                await admin.createTopics({
                    topics: [{ topic: topicName, numPartitions: 1 }],
                });

                // Produce ordered messages
                const messages = Array.from({ length: 10 }, (_, i) => ({
                    value: `${i}`,
                }));

                await producer.send({ topic: topicName, messages });

                const consumer = kafka.consumer({
                    groupId: 'test-group-order',
                });
                await consumer.connect();
                await consumer.subscribe({
                    topic: topicName,
                    fromBeginning: true,
                });

                const received: number[] = [];
                await new Promise(resolve => {
                    consumer.run({
                        eachMessage: async ({ message }) => {
                            received.push(parseInt(message.value!.toString()));

                            if (received.length === 10) {
                                resolve(null);
                            }
                        },
                    });
                });

                expect(received).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

                await consumer.disconnect();
                await admin.deleteTopics({ topics: [topicName] });
            },
            TEST_TIMEOUT,
        );
    });

    describe('Error Handling', () => {
        it('should handle non-existent topic gracefully', async () => {
            const consumer = kafka.consumer({ groupId: 'test-error-topic' });
            await consumer.connect();

            await expect(
                consumer.subscribe({
                    topic: 'non-existent-topic-xyz',
                    fromBeginning: true,
                }),
            ).rejects.toThrow();

            await consumer.disconnect();
        });

        it(
            'should retry on temporary failures',
            async () => {
                const topicName = `test-topic-retry-${Date.now()}`;

                await admin.createTopics({
                    topics: [{ topic: topicName, numPartitions: 1 }],
                });

                await producer.send({
                    topic: topicName,
                    messages: [{ value: 'test' }],
                });

                const consumer = kafka.consumer({
                    groupId: 'test-group-retry',
                    retry: {
                        retries: 3,
                        initialRetryTime: 100,
                    },
                });

                await consumer.connect();
                await consumer.subscribe({
                    topic: topicName,
                    fromBeginning: true,
                });

                let attempts = 0;
                await new Promise(resolve => {
                    consumer.run({
                        eachMessage: async ({ message }) => {
                            attempts++;

                            if (attempts < 2) {
                                throw new Error('Temporary failure');
                            }

                            resolve(message.value!.toString());
                        },
                    });
                });

                expect(attempts).toBeGreaterThanOrEqual(2);

                await consumer.disconnect();
                await admin.deleteTopics({ topics: [topicName] });
            },
            TEST_TIMEOUT,
        );
    });
});
