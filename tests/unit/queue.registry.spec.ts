import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueueRegistry } from '../../src/queue.registry';
import {
    SimpleConsumer,
    PriorityConsumer,
    PubSubConsumer,
    MultiParamConsumer,
} from '../fixtures/consumers';

describe('QueueRegistry', () => {
    beforeEach(() => {
        QueueRegistry.clear();
    });

    afterEach(() => {
        QueueRegistry.clear();
    });

    describe('registerChannel()', () => {
        it('should register a new channel with queue name', () => {
            const target = class TestQueue {};

            QueueRegistry.registerChannel(target, 'test-queue', {});

            const queues = QueueRegistry.getQueues();
            expect(queues.length).toBe(1);
            expect(queues[0][1].queueName).toBe('test-queue');
        });

        it('should register channel with default options', () => {
            const target = class TestQueue {};

            QueueRegistry.registerChannel(target, 'test-queue', {});

            const queues = QueueRegistry.getQueues();
            const metadata = queues[0][1];

            expect(metadata.pubSub).toBe(false);
            expect(metadata.durable).toBe(false);
            expect(metadata.autoDelete).toBe(false);
            expect(metadata.exclusive).toBe(false);
            expect(metadata.exchangeName).toBe('exchange-name');
        });

        it('should register channel with custom options', () => {
            const target = class TestQueue {};
            const options = {
                pubSub: true,
                durable: true,
                autoDelete: true,
                exclusive: true,
                exchangeName: 'custom-exchange',
            };

            QueueRegistry.registerChannel(target, 'test-queue', options);

            const queues = QueueRegistry.getQueues();
            const metadata = queues[0][1];

            expect(metadata.pubSub).toBe(true);
            expect(metadata.durable).toBe(true);
            expect(metadata.autoDelete).toBe(true);
            expect(metadata.exclusive).toBe(true);
            expect(metadata.exchangeName).toBe('custom-exchange');
        });

        it('should merge options when channel already exists', () => {
            const target = class TestQueue {};

            QueueRegistry.registerChannel(target, 'test-queue', {
                durable: true,
            });
            QueueRegistry.registerChannel(target, 'test-queue-2', {
                pubSub: true,
            });

            const queues = QueueRegistry.getQueues();
            expect(queues.length).toBe(1);

            const metadata = queues[0][1];
            expect(metadata.queueName).toBe('test-queue-2');
            expect(metadata.pubSub).toBe(true);
        });

        it('should initialize empty consumes array', () => {
            const target = class TestQueue {};

            QueueRegistry.registerChannel(target, 'test-queue', {});

            const queues = QueueRegistry.getQueues();
            const metadata = queues[0][1];

            expect(metadata.consumes).toBeDefined();
            expect(Array.isArray(metadata.consumes)).toBe(true);
            expect(metadata.consumes.length).toBe(0);
        });
    });

    describe('registerConsumeHandler()', () => {
        it('should register consume handler for existing queue', () => {
            class TestQueue {}
            QueueRegistry.registerChannel(TestQueue, 'test-queue', {});

            const instance = new TestQueue();
            QueueRegistry.registerConsumeHandler(
                instance,
                'test-message',
                'handleMessage',
            );

            const consumes = QueueRegistry.getConsumes(TestQueue);
            expect(consumes.length).toBe(1);
            expect(consumes[0].message).toBe('test-message');
            expect(consumes[0].handlerName).toBe('handleMessage');
        });

        it('should create queue if not exists when registering handler', () => {
            class TestQueue {}
            Reflect.defineMetadata('channel_queue', 'test-queue', TestQueue);
            Reflect.defineMetadata('channel_options', {}, TestQueue);

            const instance = new TestQueue();
            QueueRegistry.registerConsumeHandler(
                instance,
                'test-message',
                'handleMessage',
            );

            const queues = QueueRegistry.getQueues();
            expect(queues.length).toBe(1);
            expect(queues[0][1].queueName).toBe('test-queue');
        });

        it('should update existing handler message', () => {
            class TestQueue {}
            QueueRegistry.registerChannel(TestQueue, 'test-queue', {});

            const instance = new TestQueue();
            QueueRegistry.registerConsumeHandler(
                instance,
                'message-1',
                'handler',
            );
            QueueRegistry.registerConsumeHandler(
                instance,
                'message-2',
                'handler',
            );

            const consumes = QueueRegistry.getConsumes(TestQueue);
            expect(consumes.length).toBe(1);
            expect(consumes[0].message).toBe('message-2');
        });

        it('should register multiple handlers for same queue', () => {
            class TestQueue {}
            QueueRegistry.registerChannel(TestQueue, 'test-queue', {});

            const instance = new TestQueue();
            QueueRegistry.registerConsumeHandler(
                instance,
                'message-1',
                'handler1',
            );
            QueueRegistry.registerConsumeHandler(
                instance,
                'message-2',
                'handler2',
            );

            const consumes = QueueRegistry.getConsumes(TestQueue);
            expect(consumes.length).toBe(2);
        });

        it('should initialize empty params array for handler', () => {
            class TestQueue {}
            QueueRegistry.registerChannel(TestQueue, 'test-queue', {});

            const instance = new TestQueue();
            QueueRegistry.registerConsumeHandler(
                instance,
                'test-message',
                'handler',
            );

            const consumes = QueueRegistry.getConsumes(TestQueue);
            expect(consumes[0].params).toBeDefined();
            expect(Array.isArray(consumes[0].params)).toBe(true);
            expect(consumes[0].params.length).toBe(0);
        });
    });

    describe('registerParam()', () => {
        it('should register parameter for existing handler', () => {
            class TestQueue {}
            QueueRegistry.registerChannel(TestQueue, 'test-queue', {});

            const instance = new TestQueue();
            QueueRegistry.registerConsumeHandler(
                instance,
                'test-message',
                'handler',
            );
            QueueRegistry.registerParam(instance, 'handler', 'message', 0);

            const params = QueueRegistry.getParams(instance, 'handler');
            expect(params.length).toBe(1);
            expect(params[0].paramType).toBe('message');
            expect(params[0].index).toBe(0);
        });

        it('should create handler if not exists when registering param', () => {
            class TestQueue {}
            Reflect.defineMetadata('channel_queue', 'test-queue', TestQueue);
            Reflect.defineMetadata('channel_options', {}, TestQueue);

            const instance = new TestQueue();
            QueueRegistry.registerParam(instance, 'handler', 'message', 0);

            const consumes = QueueRegistry.getConsumes(TestQueue);
            expect(consumes.length).toBe(1);
            expect(consumes[0].handlerName).toBe('handler');
        });

        it('should register multiple parameters with different indices', () => {
            class TestQueue {}
            QueueRegistry.registerChannel(TestQueue, 'test-queue', {});

            const instance = new TestQueue();
            QueueRegistry.registerConsumeHandler(
                instance,
                'test-message',
                'handler',
            );
            QueueRegistry.registerParam(instance, 'handler', 'message', 0);
            QueueRegistry.registerParam(instance, 'handler', 'channel', 1);
            QueueRegistry.registerParam(instance, 'handler', 'conn', 2);

            const params = QueueRegistry.getParams(instance, 'handler');
            expect(params.length).toBe(3);
            expect(params[0].paramType).toBe('message');
            expect(params[1].paramType).toBe('channel');
            expect(params[2].paramType).toBe('conn');
        });

        it('should maintain parameter order by index', () => {
            class TestQueue {}
            QueueRegistry.registerChannel(TestQueue, 'test-queue', {});

            const instance = new TestQueue();
            QueueRegistry.registerConsumeHandler(
                instance,
                'test-message',
                'handler',
            );

            // Register out of order
            QueueRegistry.registerParam(instance, 'handler', 'conn', 2);
            QueueRegistry.registerParam(instance, 'handler', 'message', 0);
            QueueRegistry.registerParam(instance, 'handler', 'channel', 1);

            const params = QueueRegistry.getParams(instance, 'handler');
            expect(params[0].index).toBe(2);
            expect(params[1].index).toBe(0);
            expect(params[2].index).toBe(1);
        });
    });

    describe('getQueues()', () => {
        it('should return empty array when no queues registered', () => {
            const queues = QueueRegistry.getQueues();
            expect(queues).toBeDefined();
            expect(Array.isArray(queues)).toBe(true);
            expect(queues.length).toBe(0);
        });

        it('should return all registered queues', () => {
            const target1 = class Queue1 {};
            const target2 = class Queue2 {};

            QueueRegistry.registerChannel(target1, 'queue-1', {});
            QueueRegistry.registerChannel(target2, 'queue-2', {});

            const queues = QueueRegistry.getQueues();
            expect(queues.length).toBe(2);
        });

        it('should return queue entries with target and metadata', () => {
            const target = class TestQueue {};
            QueueRegistry.registerChannel(target, 'test-queue', {});

            const queues = QueueRegistry.getQueues();
            expect(queues[0][0]).toBe(target);
            expect(queues[0][1]).toHaveProperty('queueName');
            expect(queues[0][1]).toHaveProperty('consumes');
        });
    });

    describe('getConsumes()', () => {
        it('should return empty array for non-existent queue', () => {
            const target = class TestQueue {};
            const consumes = QueueRegistry.getConsumes(target);

            expect(consumes).toBeDefined();
            expect(Array.isArray(consumes)).toBe(true);
            expect(consumes.length).toBe(0);
        });

        it('should return all consume handlers for queue', () => {
            class TestQueue {}
            QueueRegistry.registerChannel(TestQueue, 'test-queue', {});

            const instance = new TestQueue();
            QueueRegistry.registerConsumeHandler(
                instance,
                'message-1',
                'handler1',
            );
            QueueRegistry.registerConsumeHandler(
                instance,
                'message-2',
                'handler2',
            );

            const consumes = QueueRegistry.getConsumes(TestQueue);
            expect(consumes.length).toBe(2);
        });
    });

    describe('getParams()', () => {
        it('should return empty array for non-existent handler', () => {
            const target = class TestQueue {};
            const instance = new target();

            const params = QueueRegistry.getParams(instance, 'nonexistent');
            expect(params).toBeDefined();
            expect(Array.isArray(params)).toBe(true);
            expect(params.length).toBe(0);
        });

        it('should return parameters for specific handler', () => {
            class TestQueue {}
            QueueRegistry.registerChannel(TestQueue, 'test-queue', {});

            const instance = new TestQueue();
            QueueRegistry.registerConsumeHandler(
                instance,
                'test-message',
                'handler',
            );
            QueueRegistry.registerParam(instance, 'handler', 'message', 0);
            QueueRegistry.registerParam(instance, 'handler', 'channel', 1);

            const params = QueueRegistry.getParams(instance, 'handler');
            expect(params.length).toBe(2);
        });
    });

    describe('clear()', () => {
        it('should clear all registered queues', () => {
            const target1 = class Queue1 {};
            const target2 = class Queue2 {};

            QueueRegistry.registerChannel(target1, 'queue-1', {});
            QueueRegistry.registerChannel(target2, 'queue-2', {});

            expect(QueueRegistry.getQueues().length).toBe(2);

            QueueRegistry.clear();

            expect(QueueRegistry.getQueues().length).toBe(0);
        });

        it('should allow re-registration after clear', () => {
            const target = class TestQueue {};

            QueueRegistry.registerChannel(target, 'queue-1', {});
            QueueRegistry.clear();
            QueueRegistry.registerChannel(target, 'queue-2', {});

            const queues = QueueRegistry.getQueues();
            expect(queues.length).toBe(1);
            expect(queues[0][1].queueName).toBe('queue-2');
        });
    });
});
