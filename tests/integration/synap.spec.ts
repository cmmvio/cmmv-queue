import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Synap } from '@hivellm/synap';
import { wait } from '../helpers/test-helpers';

// These tests require Synap running on localhost:15500
const SYNAP_URL = process.env.SYNAP_URL || 'http://localhost:15500';
const TEST_TIMEOUT = 30000; // 30 seconds

describe('Synap Integration Tests', () => {
    let synap: Synap;

    beforeAll(async () => {
        synap = new Synap({ url: SYNAP_URL });
    }, TEST_TIMEOUT);

    afterAll(async () => {
        if (synap) {
            await synap.close?.();
        }
    });

    describe('Queue Operations', () => {
        it('should create a queue', async () => {
            const queueName = `test-queue-create-${Date.now()}`;

            await synap.queue.createQueue(queueName);

            const queues = await synap.queue.listQueues();
            expect(queues).toContain(queueName);

            await synap.queue.deleteQueue(queueName);
        });

        it('should publish and consume message', async () => {
            const queueName = `test-queue-pubsub-${Date.now()}`;
            const message = { task: 'test-task', data: 'test-data' };

            await synap.queue.createQueue(queueName);

            const msgId = await synap.queue.publishJSON(queueName, message);
            expect(msgId).toBeDefined();

            const { message: consumed, data } = await synap.queue.consumeJSON(
                queueName,
                'test-consumer',
            );

            expect(consumed).toBeDefined();
            expect(data).toEqual(message);

            if (consumed) {
                await synap.queue.ack(queueName, consumed.id);
            }

            await synap.queue.deleteQueue(queueName);
        });

        it('should handle ACK and remove message', async () => {
            const queueName = `test-queue-ack-${Date.now()}`;

            await synap.queue.createQueue(queueName);
            await synap.queue.publishString(queueName, 'test message');

            const { message } = await synap.queue.consumeString(
                queueName,
                'consumer',
            );

            if (message) {
                await synap.queue.ack(queueName, message.id);
            }

            const stats = await synap.queue.stats(queueName);
            expect(stats.depth).toBe(0);

            await synap.queue.deleteQueue(queueName);
        });

        it('should handle NACK and requeue message', async () => {
            const queueName = `test-queue-nack-${Date.now()}`;

            await synap.queue.createQueue(queueName);
            await synap.queue.publishString(queueName, 'test');

            const { message: msg1 } = await synap.queue.consumeString(
                queueName,
                'consumer',
            );

            if (msg1) {
                await synap.queue.nack(queueName, msg1.id, true); // Requeue
            }

            await wait(100);

            const { message: msg2 } = await synap.queue.consumeString(
                queueName,
                'consumer',
            );

            expect(msg2).toBeDefined();

            if (msg2) {
                await synap.queue.ack(queueName, msg2.id);
            }

            await synap.queue.deleteQueue(queueName);
        });

        it('should handle priority messages', async () => {
            const queueName = `test-queue-priority-${Date.now()}`;

            await synap.queue.createQueue(queueName);

            await synap.queue.publishString(queueName, 'low', { priority: 1 });
            await synap.queue.publishString(queueName, 'high', { priority: 9 });
            await synap.queue.publishString(queueName, 'medium', {
                priority: 5,
            });

            await wait(100);

            const { text: first } = await synap.queue.consumeString(
                queueName,
                'consumer',
            );

            expect(first).toBe('high'); // Highest priority first

            await synap.queue.purge(queueName);
            await synap.queue.deleteQueue(queueName);
        });

        it('should get queue statistics', async () => {
            const queueName = `test-queue-stats-${Date.now()}`;

            await synap.queue.createQueue(queueName);
            await synap.queue.publishString(queueName, 'msg1');
            await synap.queue.publishString(queueName, 'msg2');
            await synap.queue.publishString(queueName, 'msg3');

            const stats = await synap.queue.stats(queueName);

            expect(stats.depth).toBe(3);
            expect(stats.published).toBeGreaterThanOrEqual(3);

            await synap.queue.purge(queueName);
            await synap.queue.deleteQueue(queueName);
        });
    });

    describe('Pub/Sub Operations', () => {
        it('should publish to topic', async () => {
            const topic = `test.topic.${Date.now()}`;
            const message = { event: 'test', data: 'test-data' };

            const result = await synap.pubsub.publish(topic, message);
            expect(result).toBeDefined();
        });

        it('should handle multiple topics', async () => {
            const topics = [
                `test.user.created.${Date.now()}`,
                `test.user.updated.${Date.now()}`,
                `test.user.deleted.${Date.now()}`,
            ];

            for (const topic of topics) {
                const result = await synap.pubsub.publish(topic, { topic });
                expect(result).toBeDefined();
            }
        });
    });

    describe('Performance', () => {
        it('should handle rapid message publishing', async () => {
            const queueName = `test-queue-perf-${Date.now()}`;

            await synap.queue.createQueue(queueName);

            const startTime = Date.now();
            const messageCount = 100;

            for (let i = 0; i < messageCount; i++) {
                await synap.queue.publishJSON(queueName, { id: i });
            }

            const duration = Date.now() - startTime;

            console.log(`Published ${messageCount} messages in ${duration}ms`);
            console.log(
                `Throughput: ${((messageCount / duration) * 1000).toFixed(0)} msg/s`,
            );

            const stats = await synap.queue.stats(queueName);
            expect(stats.published).toBe(messageCount);

            await synap.queue.purge(queueName);
            await synap.queue.deleteQueue(queueName);
        }, 60000);

        it('should handle large messages', async () => {
            const queueName = `test-queue-large-${Date.now()}`;
            const largeData = 'x'.repeat(50000); // 50KB

            await synap.queue.createQueue(queueName);
            await synap.queue.publishJSON(queueName, { data: largeData });

            const { message, data } = await synap.queue.consumeJSON(
                queueName,
                'consumer',
            );

            expect(data).toEqual({ data: largeData });

            if (message) {
                await synap.queue.ack(queueName, message.id);
            }

            await synap.queue.deleteQueue(queueName);
        });
    });

    describe('Error Handling', () => {
        it('should handle non-existent queue gracefully', async () => {
            const { message } = await synap.queue.consumeString(
                'non-existent-queue-xyz',
                'consumer',
            );

            expect(message).toBeNull();
        });

        it('should handle queue management', async () => {
            const queueName = `test-queue-mgmt-${Date.now()}`;

            await synap.queue.createQueue(queueName);

            const queues = await synap.queue.listQueues();
            expect(queues).toContain(queueName);

            await synap.queue.deleteQueue(queueName);

            const queuesAfter = await synap.queue.listQueues();
            expect(queuesAfter).not.toContain(queueName);
        });
    });
});
