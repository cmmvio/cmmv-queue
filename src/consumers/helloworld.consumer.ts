import { 
    Channel, Consume, 
    QueueMessage, QueueConn,
    QueueChannel 
} from "../decorators";

import { QueueService } from "../services";

@Channel("hello-world")
export class HelloWorldConsumer {
    constructor(private readonly queueService: QueueService) {}

    @Consume("hello-world")
    public async OnReciveMessage(
        @QueueMessage() message, 
        @QueueChannel() channel,
        @QueueConn() conn
    ){
        console.log("hello-world", message);
        this.queueService.send("hello-world", "niceday", "NiceDay");
    }

    @Consume("niceday")
    public async OnReciveHaveANiceDay(@QueueMessage() message){
        console.log("Have a nice day!")
    }
}