import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    Channel,
    Consume,
    QueueMessage,
    QueueChannel,
    QueueConn,
} from '../../src/queue.decorator';
import { QueueRegistry } from '../../src/queue.registry';

describe('Queue Decorators', () => {
    beforeEach(() => {
        QueueRegistry.clear();
    });

    afterEach(() => {
        QueueRegistry.clear();
    });

    describe('@Channel', () => {
        it('should register channel metadata on class', () => {
            @Channel('test-queue')
            class TestQueue {}

            const queues = QueueRegistry.getQueues();
            expect(queues.length).toBe(1);
            expect(queues[0][0]).toBe(TestQueue);
            expect(queues[0][1].queueName).toBe('test-queue');
        });

        it('should register channel with default options', () => {
            @Channel('test-queue')
            class TestQueue {}

            const queues = QueueRegistry.getQueues();
            const metadata = queues[0][1];

            expect(metadata.pubSub).toBe(false);
            expect(metadata.durable).toBe(false);
            expect(metadata.autoDelete).toBe(false);
            expect(metadata.exclusive).toBe(false);
        });

        it('should register channel with custom options', () => {
            @Channel('test-queue', {
                pubSub: true,
                durable: true,
                autoDelete: true,
                exclusive: true,
                exchangeName: 'custom-exchange',
            })
            class TestQueue {}

            const queues = QueueRegistry.getQueues();
            const metadata = queues[0][1];

            expect(metadata.pubSub).toBe(true);
            expect(metadata.durable).toBe(true);
            expect(metadata.autoDelete).toBe(true);
            expect(metadata.exclusive).toBe(true);
            expect(metadata.exchangeName).toBe('custom-exchange');
        });

        it('should set reflection metadata on class', () => {
            @Channel('test-queue', { pubSub: true })
            class TestQueue {}

            const queueName = Reflect.getMetadata('channel_queue', TestQueue);
            const options = Reflect.getMetadata('channel_options', TestQueue);

            expect(queueName).toBe('test-queue');
            expect(options).toBeDefined();
            expect(options.pubSub).toBe(true);
        });

        it('should work with multiple channels', () => {
            @Channel('queue-1')
            class Queue1 {}

            @Channel('queue-2')
            class Queue2 {}

            const queues = QueueRegistry.getQueues();
            expect(queues.length).toBe(2);
        });
    });

    describe('@Consume', () => {
        it('should register consume handler', () => {
            @Channel('test-queue')
            class TestQueue {
                @Consume('test-message')
                handleMessage() {}
            }

            const consumes = QueueRegistry.getConsumes(TestQueue);
            expect(consumes.length).toBe(1);
            expect(consumes[0].message).toBe('test-message');
            expect(consumes[0].handlerName).toBe('handleMessage');
        });

        it('should register multiple consume handlers', () => {
            @Channel('test-queue')
            class TestQueue {
                @Consume('message-1')
                handleMessage1() {}

                @Consume('message-2')
                handleMessage2() {}
            }

            const consumes = QueueRegistry.getConsumes(TestQueue);
            expect(consumes.length).toBe(2);
        });

        it('should work with async methods', () => {
            @Channel('test-queue')
            class TestQueue {
                @Consume('async-message')
                async handleAsync() {
                    return 'done';
                }
            }

            const consumes = QueueRegistry.getConsumes(TestQueue);
            expect(consumes.length).toBe(1);
            expect(consumes[0].handlerName).toBe('handleAsync');
        });

        it('should create queue if @Channel not present', () => {
            class TestQueue {
                @Consume('test-message')
                handleMessage() {}
            }

            // Set metadata manually (normally done by @Channel)
            Reflect.defineMetadata('channel_queue', 'auto-queue', TestQueue);
            Reflect.defineMetadata('channel_options', {}, TestQueue);

            const instance = new TestQueue();
            QueueRegistry.registerConsumeHandler(
                instance,
                'test-message',
                'handleMessage',
            );

            const queues = QueueRegistry.getQueues();
            expect(queues.length).toBe(1);
        });
    });

    describe('@QueueMessage', () => {
        it('should register message parameter', () => {
            @Channel('test-queue')
            class TestQueue {
                @Consume('test-message')
                handleMessage(@QueueMessage() message: any) {}
            }

            const instance = new TestQueue();
            const params = QueueRegistry.getParams(instance, 'handleMessage');

            expect(params.length).toBe(1);
            expect(params[0].paramType).toBe('message');
            expect(params[0].index).toBe(0);
        });

        it('should register parameter at correct index', () => {
            @Channel('test-queue')
            class TestQueue {
                @Consume('test-message')
                handleMessage(ignored: string, @QueueMessage() message: any) {}
            }

            const instance = new TestQueue();
            const params = QueueRegistry.getParams(instance, 'handleMessage');

            const messageParam = params.find(p => p.paramType === 'message');
            expect(messageParam).toBeDefined();
            expect(messageParam!.index).toBe(1);
        });
    });

    describe('@QueueChannel', () => {
        it('should register channel parameter', () => {
            @Channel('test-queue')
            class TestQueue {
                @Consume('test-message')
                handleMessage(@QueueChannel() channel: any) {}
            }

            const instance = new TestQueue();
            const params = QueueRegistry.getParams(instance, 'handleMessage');

            expect(params.length).toBe(1);
            expect(params[0].paramType).toBe('channel');
            expect(params[0].index).toBe(0);
        });
    });

    describe('@QueueConn', () => {
        it('should register connection parameter', () => {
            @Channel('test-queue')
            class TestQueue {
                @Consume('test-message')
                handleMessage(@QueueConn() conn: any) {}
            }

            const instance = new TestQueue();
            const params = QueueRegistry.getParams(instance, 'handleMessage');

            expect(params.length).toBe(1);
            expect(params[0].paramType).toBe('conn');
            expect(params[0].index).toBe(0);
        });
    });

    describe('Multiple Parameter Decorators', () => {
        it('should register all parameters in correct order', () => {
            @Channel('test-queue')
            class TestQueue {
                @Consume('test-message')
                handleMessage(
                    @QueueMessage() message: any,
                    @QueueChannel() channel: any,
                    @QueueConn() conn: any,
                ) {}
            }

            const instance = new TestQueue();
            const params = QueueRegistry.getParams(instance, 'handleMessage');

            expect(params.length).toBe(3);

            // Find each parameter
            const messageParam = params.find(p => p.paramType === 'message');
            const channelParam = params.find(p => p.paramType === 'channel');
            const connParam = params.find(p => p.paramType === 'conn');

            expect(messageParam).toBeDefined();
            expect(channelParam).toBeDefined();
            expect(connParam).toBeDefined();

            expect(messageParam!.index).toBe(0);
            expect(channelParam!.index).toBe(1);
            expect(connParam!.index).toBe(2);
        });

        it('should handle mixed decorated and non-decorated parameters', () => {
            @Channel('test-queue')
            class TestQueue {
                @Consume('test-message')
                handleMessage(
                    nonDecorated: string,
                    @QueueMessage() message: any,
                    anotherNonDecorated: number,
                    @QueueChannel() channel: any,
                ) {}
            }

            const instance = new TestQueue();
            const params = QueueRegistry.getParams(instance, 'handleMessage');

            expect(params.length).toBe(2);

            const messageParam = params.find(p => p.paramType === 'message');
            const channelParam = params.find(p => p.paramType === 'channel');

            expect(messageParam!.index).toBe(1);
            expect(channelParam!.index).toBe(3);
        });
    });

    describe('Decorator Composition', () => {
        it('should work with @Channel and multiple @Consume decorators', () => {
            @Channel('multi-queue')
            class MultiQueue {
                @Consume('message-1')
                handleMessage1(@QueueMessage() message: any) {}

                @Consume('message-2')
                handleMessage2(
                    @QueueMessage() message: any,
                    @QueueChannel() channel: any,
                ) {}

                @Consume('message-3')
                handleMessage3(
                    @QueueMessage() message: any,
                    @QueueChannel() channel: any,
                    @QueueConn() conn: any,
                ) {}
            }

            const consumes = QueueRegistry.getConsumes(MultiQueue);
            expect(consumes.length).toBe(3);

            const instance = new MultiQueue();
            const params1 = QueueRegistry.getParams(instance, 'handleMessage1');
            const params2 = QueueRegistry.getParams(instance, 'handleMessage2');
            const params3 = QueueRegistry.getParams(instance, 'handleMessage3');

            expect(params1.length).toBe(1);
            expect(params2.length).toBe(2);
            expect(params3.length).toBe(3);
        });

        it('should work with pub/sub configuration', () => {
            @Channel('pubsub-queue', {
                pubSub: true,
                exchangeName: 'events',
            })
            class PubSubQueue {
                @Consume('user.created')
                handleUserCreated(@QueueMessage() message: any) {}

                @Consume('user.updated')
                handleUserUpdated(@QueueMessage() message: any) {}
            }

            const queues = QueueRegistry.getQueues();
            const metadata = queues[0][1];

            expect(metadata.pubSub).toBe(true);
            expect(metadata.exchangeName).toBe('events');

            const consumes = QueueRegistry.getConsumes(PubSubQueue);
            expect(consumes.length).toBe(2);
        });
    });
});
