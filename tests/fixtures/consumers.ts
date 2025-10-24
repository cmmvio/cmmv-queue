// Test consumer fixtures
import {
    Channel,
    Consume,
    QueueMessage,
    QueueChannel,
    QueueConn,
} from '../../src/queue.decorator';

@Channel('test-queue')
export class SimpleConsumer {
    @Consume('test-message')
    async handleMessage(@QueueMessage() message: any) {
        return message;
    }
}

@Channel('priority-queue', { durable: true })
export class PriorityConsumer {
    @Consume('high-priority')
    async handleHighPriority(
        @QueueMessage() message: any,
        @QueueChannel() channel: any,
    ) {
        return { message, channel };
    }
}

@Channel('pubsub-channel', { pubSub: true, exchangeName: 'events' })
export class PubSubConsumer {
    @Consume('user.created')
    async handleUserCreated(@QueueMessage() message: any) {
        return message;
    }

    @Consume('user.updated')
    async handleUserUpdated(@QueueMessage() message: any) {
        return message;
    }
}

@Channel('multi-param-queue')
export class MultiParamConsumer {
    @Consume('multi')
    async handleMulti(
        @QueueMessage() message: any,
        @QueueChannel() channel: any,
        @QueueConn() conn: any,
    ) {
        return { message, channel, conn };
    }
}

@Channel('error-queue')
export class ErrorConsumer {
    @Consume('error-message')
    async handleError(@QueueMessage() message: any) {
        throw new Error('Intentional error for testing');
    }
}
