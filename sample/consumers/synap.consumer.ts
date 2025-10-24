import { Channel, Consume, QueueMessage } from '../../src/queue.decorator';

import { QueueService } from '../../src/queue.service';

/**
 * Example Synap Queue Consumer
 *
 * Demonstrates using Synap for high-performance queue operations.
 * Synap provides 100x faster throughput compared to traditional queues.
 */
@Channel('synap-orders', { durable: true })
export class SynapOrderConsumer {
    constructor(private readonly queueService: QueueService) {}

    @Consume('new-order')
    public async handleNewOrder(@QueueMessage() message: any) {
        console.log('[Synap] New order received:', message);

        // Process order
        // Synap automatically handles ACK on success, NACK on error

        // Example: Send confirmation
        await this.queueService.send('synap-orders', 'order-confirmed', {
            orderId: message.orderId,
            status: 'confirmed',
            timestamp: new Date().toISOString(),
        });
    }

    @Consume('order-confirmed')
    public async handleOrderConfirmation(@QueueMessage() message: any) {
        console.log('[Synap] Order confirmed:', message.orderId);
    }
}

/**
 * Example Synap Pub/Sub Consumer
 *
 * Demonstrates using Synap pub/sub for broadcast messaging.
 */
@Channel('synap-events', {
    pubSub: true,
    exchangeName: 'app-events',
})
export class SynapEventConsumer {
    constructor(private readonly queueService: QueueService) {}

    @Consume('user.created')
    public async handleUserCreated(@QueueMessage() message: any) {
        console.log('[Synap Pub/Sub] User created:', message);
    }

    @Consume('user.updated')
    public async handleUserUpdated(@QueueMessage() message: any) {
        console.log('[Synap Pub/Sub] User updated:', message);
    }

    @Consume('user.deleted')
    public async handleUserDeleted(@QueueMessage() message: any) {
        console.log('[Synap Pub/Sub] User deleted:', message);
    }
}
