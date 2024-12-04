import { Channel, Consume, QueueMessage } from '../../src/queue.decorator';

import { QueueService } from '../../src/queue.service';

@Channel('broadcast', {
    exchangeName: 'broadcast',
    pubSub: true,
})
export class SamplePubSubConsumer {
    constructor(private readonly queueService: QueueService) {}

    @Consume('broadcast')
    public async OnReciveMessage(@QueueMessage() message) {
        console.log('pubsub message: ', message);
    }
}
