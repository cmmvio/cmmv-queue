import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Redis from 'ioredis';
import { wait } from '../helpers/test-helpers';

// These tests require Redis running on localhost:6379
// Run: docker-compose -f tests/docker-compose.yml up -d redis

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const TEST_TIMEOUT = 30000; // 30 seconds

describe('Redis Integration Tests', () => {
    let redis: Redis;

    beforeAll(async () => {
        redis = new Redis(REDIS_URL);

        // Wait for connection
        await new Promise((resolve, reject) => {
            redis.on('connect', resolve);
            redis.on('error', reject);
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });
    }, TEST_TIMEOUT);

    afterAll(async () => {
        await redis.quit();
    });

    beforeEach(async () => {
        // Clear test keys
        const keys = await redis.keys('test:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    });

    describe('Pub/Sub Messaging', () => {
        it('should publish and subscribe to channel', async () => {
            const channel = 'test:pubsub:basic';
            const message = 'Hello Redis';

            const subscriber = new Redis(REDIS_URL);

            const received = new Promise<string>(resolve => {
                subscriber.subscribe(channel);
                subscriber.on('message', (ch, msg) => {
                    if (ch === channel) {
                        resolve(msg);
                    }
                });
            });

            await wait(100); // Wait for subscription

            await redis.publish(channel, message);

            const result = await received;
            expect(result).toBe(message);

            await subscriber.quit();
        });

        it('should handle multiple subscribers', async () => {
            const channel = 'test:pubsub:multi';
            const message = 'Broadcast message';

            const sub1 = new Redis(REDIS_URL);
            const sub2 = new Redis(REDIS_URL);
            const sub3 = new Redis(REDIS_URL);

            const received = {
                sub1: new Promise<string>(resolve => {
                    sub1.subscribe(channel);
                    sub1.on('message', (_, msg) => resolve(msg));
                }),
                sub2: new Promise<string>(resolve => {
                    sub2.subscribe(channel);
                    sub2.on('message', (_, msg) => resolve(msg));
                }),
                sub3: new Promise<string>(resolve => {
                    sub3.subscribe(channel);
                    sub3.on('message', (_, msg) => resolve(msg));
                }),
            };

            await wait(100);

            await redis.publish(channel, message);

            const results = await Promise.all([
                received.sub1,
                received.sub2,
                received.sub3,
            ]);

            expect(results).toEqual([message, message, message]);

            await sub1.quit();
            await sub2.quit();
            await sub3.quit();
        });

        it('should support pattern subscriptions', async () => {
            const subscriber = new Redis(REDIS_URL);

            const received: string[] = [];
            const promise = new Promise<void>(resolve => {
                subscriber.psubscribe('test:events:*');
                subscriber.on('pmessage', (pattern, channel, message) => {
                    received.push(message);
                    if (received.length === 3) {
                        resolve();
                    }
                });
            });

            await wait(100);

            await redis.publish('test:events:user', 'user event');
            await redis.publish('test:events:order', 'order event');
            await redis.publish('test:events:payment', 'payment event');

            await promise;

            expect(received).toContain('user event');
            expect(received).toContain('order event');
            expect(received).toContain('payment event');

            await subscriber.quit();
        });

        it('should unsubscribe from channel', async () => {
            const channel = 'test:pubsub:unsub';
            const subscriber = new Redis(REDIS_URL);

            let messageCount = 0;
            subscriber.subscribe(channel);
            subscriber.on('message', () => {
                messageCount++;
            });

            await wait(100);

            await redis.publish(channel, 'message1');
            await wait(100);

            await subscriber.unsubscribe(channel);
            await wait(100);

            await redis.publish(channel, 'message2');
            await wait(100);

            expect(messageCount).toBe(1);

            await subscriber.quit();
        });
    });

    describe('List-Based Queue Operations', () => {
        it('should push and pop from list', async () => {
            const queueKey = 'test:queue:basic';
            const message = 'queue message';

            await redis.rpush(queueKey, message);

            const result = await redis.lpop(queueKey);
            expect(result).toBe(message);
        });

        it('should maintain FIFO order', async () => {
            const queueKey = 'test:queue:fifo';
            const messages = ['first', 'second', 'third'];

            for (const msg of messages) {
                await redis.rpush(queueKey, msg);
            }

            const received: string[] = [];
            for (let i = 0; i < 3; i++) {
                const msg = await redis.lpop(queueKey);
                if (msg) received.push(msg);
            }

            expect(received).toEqual(messages);
        });

        it('should handle empty queue', async () => {
            const queueKey = 'test:queue:empty';

            const result = await redis.lpop(queueKey);
            expect(result).toBeNull();
        });

        it('should block until message available (BLPOP)', async () => {
            const queueKey = 'test:queue:blocking';

            const popPromise = redis.blpop(queueKey, 5);

            await wait(100);

            await redis.rpush(queueKey, 'delayed message');

            const result = await popPromise;
            expect(result).toEqual([queueKey, 'delayed message']);
        });

        it('should timeout on BLPOP', async () => {
            const queueKey = 'test:queue:timeout';

            const result = await redis.blpop(queueKey, 1);
            expect(result).toBeNull();
        });

        it('should get queue length', async () => {
            const queueKey = 'test:queue:length';

            await redis.rpush(queueKey, 'msg1', 'msg2', 'msg3');

            const length = await redis.llen(queueKey);
            expect(length).toBe(3);
        });

        it('should handle multiple messages at once', async () => {
            const queueKey = 'test:queue:multi';

            await redis.rpush(queueKey, 'msg1', 'msg2', 'msg3', 'msg4', 'msg5');

            const all = await redis.lrange(queueKey, 0, -1);
            expect(all).toHaveLength(5);
        });
    });

    describe('JSON Message Handling', () => {
        it('should serialize and deserialize JSON messages', async () => {
            const queueKey = 'test:queue:json';
            const message = {
                id: 123,
                data: 'test data',
                timestamp: Date.now(),
            };

            await redis.rpush(queueKey, JSON.stringify(message));

            const result = await redis.lpop(queueKey);
            const parsed = result ? JSON.parse(result) : null;

            expect(parsed).toEqual(message);
        });

        it('should handle complex nested objects', async () => {
            const queueKey = 'test:queue:complex';
            const message = {
                user: {
                    id: 1,
                    name: 'John',
                    meta: {
                        settings: { theme: 'dark' },
                        preferences: ['email', 'sms'],
                    },
                },
                actions: ['create', 'update'],
            };

            await redis.rpush(queueKey, JSON.stringify(message));

            const result = await redis.lpop(queueKey);
            const parsed = result ? JSON.parse(result) : null;

            expect(parsed).toEqual(message);
        });
    });

    describe('Multiple Channels', () => {
        it('should handle multiple pub/sub channels simultaneously', async () => {
            const channels = ['test:ch1', 'test:ch2', 'test:ch3'];
            const subscriber = new Redis(REDIS_URL);

            const received = new Map<string, string>();

            const promise = new Promise<void>(resolve => {
                subscriber.subscribe(...channels);
                subscriber.on('message', (channel, message) => {
                    received.set(channel, message);
                    if (received.size === 3) {
                        resolve();
                    }
                });
            });

            await wait(100);

            await redis.publish('test:ch1', 'message1');
            await redis.publish('test:ch2', 'message2');
            await redis.publish('test:ch3', 'message3');

            await promise;

            expect(received.get('test:ch1')).toBe('message1');
            expect(received.get('test:ch2')).toBe('message2');
            expect(received.get('test:ch3')).toBe('message3');

            await subscriber.quit();
        });

        it('should handle multiple queues simultaneously', async () => {
            const queues = ['test:q1', 'test:q2', 'test:q3'];

            for (const queue of queues) {
                await redis.rpush(queue, `message-${queue}`);
            }

            for (const queue of queues) {
                const msg = await redis.lpop(queue);
                expect(msg).toBe(`message-${queue}`);
            }
        });
    });

    describe('Large Messages', () => {
        it('should handle large message payloads', async () => {
            const queueKey = 'test:queue:large';
            const largeData = 'x'.repeat(100000); // 100KB
            const message = JSON.stringify({ data: largeData });

            await redis.rpush(queueKey, message);

            const result = await redis.lpop(queueKey);
            expect(result).toBe(message);
        });

        it('should handle binary data', async () => {
            const queueKey = 'test:queue:binary';
            const buffer = Buffer.from([1, 2, 3, 4, 5]);

            await redis.rpush(queueKey, buffer.toString('base64'));

            const result = await redis.lpop(queueKey);
            const decoded = Buffer.from(result!, 'base64');

            expect(decoded).toEqual(buffer);
        });
    });

    describe('Connection Handling', () => {
        it('should reconnect after disconnection', async () => {
            const tempRedis = new Redis(REDIS_URL, {
                retryStrategy: times => {
                    if (times > 3) return null;
                    return Math.min(times * 50, 2000);
                },
            });

            await new Promise(resolve => tempRedis.on('connect', resolve));

            // Disconnect
            tempRedis.disconnect();

            // Reconnect
            await tempRedis.connect();

            const result = await tempRedis.ping();
            expect(result).toBe('PONG');

            await tempRedis.quit();
        });

        it('should handle connection errors gracefully', async () => {
            const invalidRedis = new Redis({
                host: 'invalid-host',
                port: 9999,
                retryStrategy: () => null, // Don't retry
                lazyConnect: true,
            });

            await expect(invalidRedis.connect()).rejects.toThrow();

            invalidRedis.disconnect();
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent publishers', async () => {
            const channel = 'test:pubsub:concurrent';
            const subscriber = new Redis(REDIS_URL);

            const received: string[] = [];
            const promise = new Promise<void>(resolve => {
                subscriber.subscribe(channel);
                subscriber.on('message', (_, msg) => {
                    received.push(msg);
                    if (received.length === 10) {
                        resolve();
                    }
                });
            });

            await wait(100);

            // Concurrent publishes
            const publishers = Array.from({ length: 10 }, (_, i) =>
                redis.publish(channel, `msg-${i}`),
            );

            await Promise.all(publishers);
            await promise;

            expect(received).toHaveLength(10);

            await subscriber.quit();
        });

        it('should handle concurrent queue operations', async () => {
            const queueKey = 'test:queue:concurrent';

            // Concurrent pushes
            const pushes = Array.from({ length: 100 }, (_, i) =>
                redis.rpush(queueKey, `msg-${i}`),
            );

            await Promise.all(pushes);

            const length = await redis.llen(queueKey);
            expect(length).toBe(100);

            // Concurrent pops
            const pops = Array.from({ length: 100 }, () =>
                redis.lpop(queueKey),
            );

            const results = await Promise.all(pops);
            const nonNull = results.filter(r => r !== null);

            expect(nonNull).toHaveLength(100);
        });
    });

    describe('Message Expiration (TTL)', () => {
        it('should expire messages after TTL', async () => {
            const key = 'test:key:ttl';
            const message = 'expires soon';

            await redis.setex(key, 1, message); // 1 second TTL

            const immediate = await redis.get(key);
            expect(immediate).toBe(message);

            await wait(1500);

            const afterExpiry = await redis.get(key);
            expect(afterExpiry).toBeNull();
        });

        it('should check remaining TTL', async () => {
            const key = 'test:key:ttl-check';

            await redis.setex(key, 10, 'data');

            const ttl = await redis.ttl(key);
            expect(ttl).toBeGreaterThan(0);
            expect(ttl).toBeLessThanOrEqual(10);
        });
    });

    describe('Pipeline Operations', () => {
        it('should execute pipeline of commands', async () => {
            const pipeline = redis.pipeline();

            pipeline.rpush('test:pipe:queue1', 'msg1');
            pipeline.rpush('test:pipe:queue2', 'msg2');
            pipeline.llen('test:pipe:queue1');
            pipeline.llen('test:pipe:queue2');

            const results = await pipeline.exec();

            expect(results).toHaveLength(4);
            expect(results![2][1]).toBe(1); // Length of queue1
            expect(results![3][1]).toBe(1); // Length of queue2
        });
    });
});
