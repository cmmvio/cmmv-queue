import {
    Channel,
    Consume,
    QueueMessage,
    QueueConn,
    QueueChannel,
} from '../../src/queue.decorator';

import { QueueService } from '../../src/queue.service';

@Channel('hello-world', { durable: true })
export class HelloWorldConsumer {
    constructor(private readonly queueService: QueueService) {}

    @Consume('hello-world')
    public async OnReciveMessage(
        @QueueMessage() message,
        @QueueChannel() channel,
        @QueueConn() conn,
    ) {
        console.log('hello-world', message);
        this.queueService.send('hello-world', 'niceday', 'NiceDay');
    }

    @Consume('niceday')
    public async OnReciveHaveANiceDay(@QueueMessage() message) {
        console.log('Have a nice day!');
    }
}
