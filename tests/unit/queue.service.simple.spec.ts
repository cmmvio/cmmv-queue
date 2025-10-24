import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { QueueRegistry } from '../../src/queue.registry';

describe('QueueService - Simple Tests', () => {
    beforeEach(() => {
        QueueRegistry.clear();
    });

    describe('QueueRegistry Integration', () => {
        it('should work with service for consumer registration', () => {
            class TestConsumer {}

            QueueRegistry.registerChannel(TestConsumer, 'orders', {
                durable: true,
            });
            QueueRegistry.registerConsumeHandler(
                new TestConsumer(),
                'new-order',
                'handleOrder',
            );

            const queues = QueueRegistry.getQueues();
            expect(queues.length).toBe(1);

            const consumes = QueueRegistry.getConsumes(TestConsumer);
            expect(consumes.length).toBe(1);
            expect(consumes[0].message).toBe('new-order');
        });

        it('should handle multiple consumers on different queues', () => {
            class OrderConsumer {}
            class PaymentConsumer {}

            QueueRegistry.registerChannel(OrderConsumer, 'orders', {});
            QueueRegistry.registerChannel(PaymentConsumer, 'payments', {});

            const queues = QueueRegistry.getQueues();
            expect(queues.length).toBe(2);
        });

        it('should handle parameter metadata correctly', () => {
            class TestConsumer {}

            QueueRegistry.registerChannel(TestConsumer, 'test', {});

            const instance = new TestConsumer();
            QueueRegistry.registerConsumeHandler(instance, 'msg', 'handler');
            QueueRegistry.registerParam(instance, 'handler', 'message', 0);
            QueueRegistry.registerParam(instance, 'handler', 'channel', 1);

            const params = QueueRegistry.getParams(instance, 'handler');
            expect(params).toHaveLength(2);
        });
    });
});
