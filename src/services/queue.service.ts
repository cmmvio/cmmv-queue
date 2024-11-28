import {
    Singleton, Service, Logger,
    Application, Config
} from "@cmmv/core";

import { QueueRegistry } from "../registries";
import * as amqp from "amqp-connection-manager";

@Service()
export class QueueService extends Singleton {
    public logger: Logger = new Logger('QueueService');
    public queueConn: amqp.AmqpConnectionManager;
    public channels: Map<string, any> = new Map<string, any>();
    public queues: Map<string, any> = new Map<string, any>();

    private registeredConsumers: Map<
        string,
        { instance: any; handlerName: string; params: any[] }
    > = new Map();

    public static async loadConfig(application: Application): Promise<void> {
        const instance = QueueService.getInstance();
        const queueType = Config.get<string>('queue.type', "rabbitmq");
        const queueUrl: string = Config.get<string>('queue.url', "");
        
        try {
            switch (queueType) {
                case "rabbitmq":
                    if (queueUrl.startsWith("amqp:")) {
                        instance.queueConn = amqp.connect(queueUrl);

                        if (instance.queueConn.isConnected)
                            instance.logger.log('RabbitMQ connected!');

                        const queues: any = QueueRegistry.getQueues();

                        queues.forEach(async ([controllerClass, metadata]) => {
                            const paramTypes =
                                Reflect.getMetadata('design:paramtypes', controllerClass) || [];

                            const instances = paramTypes.map((paramType: any) =>
                                application.providersMap.get(paramType.name),
                            );

                            const controllerInstance = new controllerClass(...instances);

                            metadata.consumes.forEach((consumeMetadata) => {
                                const { message, handlerName, params } = consumeMetadata;

                                instance.registeredConsumers.set(message, {
                                    instance: controllerInstance,
                                    handlerName,
                                    params,
                                });
                            });

                            if(instance.queueConn){
                                const channelWrapper = instance.queueConn.createChannel({
                                    json: true,
                                    name: metadata.queueName,
                                    setup: (channel) => {
                                        const promises = metadata.consumes.map((consume) => {
                                            return Promise.all([
                                                channel.assertQueue(consume.message, { durable: true }),
                                                channel.consume(consume.message, async (msg) => {
                                                    if (msg) {
                                                        try {
                                                            await instance.processMessage(
                                                                channel,
                                                                consume.message,
                                                                JSON.parse(msg.content.toString()),
                                                            );
                                                            channel.ack(msg); // Acknowledge the message
                                                        } catch (error) {
                                                            instance.logger.error(
                                                                `Error processing message: ${error.message}`,
                                                            );
                                                            channel.nack(msg); // Reject the message
                                                        }
                                                    }
                                                }),
                                            ]);
                                        });
    
                                        return Promise.all(promises);
                                    },
                                });

                                instance.channels.set(metadata.queueName, channelWrapper);
                            }
                            else{
                                throw new Error(
                                    `Error when trying to create a communication channel with the daughter`,
                                );
                            }
                        });
                    } else {
                        throw new Error(
                            `Could not connect to queue, please set 'queue.url' configuration correctly`,
                        );
                    }
                    break;
            }
        } catch (e) {
            instance.logger.error(e.message);
            console.log(e);
        }
    }

    private async processMessage(channel: any, queueName: string, data: any): Promise<void> {
        const instanceQueue = QueueService.getInstance();
        const consumer = this.registeredConsumers.get(queueName);

        if (consumer) {
            const { instance, handlerName, params } = consumer;

            // Resolve arguments based on parameters metadata
            const args = params
                .sort((a, b) => a.index - b.index)
                .map((param) => {
                    switch (param.paramType) {
                        case 'message': return data;
                        case 'queueName': return queueName;
                        case 'channel': return channel;
                        case 'conn': return instanceQueue.queueConn;
                        default: return undefined;
                    }
                });

            try {
                await instance[handlerName](...args);
            } catch (e) {
                instanceQueue.logger.error(`Error in handler: ${e.message}`);
            }
        } else {
            instanceQueue.logger.log(`No consumer registered for queue: ${queueName}`);
        }
    }

    public async send(
        channelName: string,
        queueName: string,
        data: any,
    ): Promise<boolean> {
        try {
            const instance = QueueService.getInstance();
            const queueType = Config.get<string>('queue.type', "rabbitmq");

            if (instance.channels.has(channelName)) {
                const channel = await instance.channels.get(channelName);

                switch (queueType) {
                    case "rabbitmq": return await channel.sendToQueue(queueName, data);
                }
            }

            return false;
        } catch (e) {
            return false;
        }
    }
}
