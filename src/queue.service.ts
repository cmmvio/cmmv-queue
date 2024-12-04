import { Singleton, Service, Logger, Application, Config } from '@cmmv/core';

import { QueueRegistry } from './queue.registry';

import * as amqp from 'amqp-connection-manager';
import { Kafka, Consumer, Producer } from 'kafkajs';
import Redis from 'ioredis';

@Service()
export class QueueService extends Singleton {
    public logger: Logger = new Logger('QueueService');
    public queueConn: any;
    public channels: Map<string, any> = new Map<string, any>();
    public queues: Map<string, any> = new Map<string, any>();
    private kafkaProducer: Producer;
    private kafkaConsumers: Consumer[] = [];
    private redisClient: Redis;

    private registeredConsumers: Map<
        string,
        { instance: any; handlerName: string; params: any[] }
    > = new Map();

    public static async loadConfig(application: Application): Promise<void> {
        const instance = QueueService.getInstance();
        const queueType = Config.get<string>('queue.type', 'rabbitmq');
        const queueUrl: string = Config.get<string>('queue.url', '');

        try {
            switch (queueType) {
                case 'rabbitmq':
                    if (queueUrl.startsWith('amqp:')) {
                        instance.queueConn = amqp.connect(queueUrl);
                        instance.queueConn.on('connect', () =>
                            instance.logger.log('RabbitMQ connected!'),
                        );
                        instance.queueConn.on('disconnect', error =>
                            instance.logger.error(error.toString()),
                        );

                        await instance.setupRabbitMQ(application);
                    } else {
                        throw new Error(
                            "Invalid RabbitMQ URL. Please check 'queue.url' configuration.",
                        );
                    }
                    break;

                case 'kafka':
                    const kafka = new Kafka({ brokers: queueUrl.split(',') });
                    instance.kafkaProducer = kafka.producer();
                    await instance.kafkaProducer.connect();

                    instance.logger.log('Kafka connected!');

                    await instance.setupKafka(application, kafka);
                    break;

                case 'redis':
                    instance.redisClient = new Redis(queueUrl);
                    instance.redisClient.on('connect', () =>
                        instance.logger.log('Redis connected!'),
                    );
                    instance.redisClient.on('error', error =>
                        instance.logger.error(error.toString()),
                    );

                    await instance.setupRedis(application);
                    break;

                default:
                    throw new Error(`Unsupported queue type: ${queueType}`);
            }
        } catch (e) {
            instance.logger.error(e.message);
            console.error(e);
        }
    }

    private async setupRabbitMQ(application: Application): Promise<void> {
        const instance = QueueService.getInstance();
        const queues: any = QueueRegistry.getQueues();

        queues.forEach(async ([controllerClass, metadata]) => {
            const paramTypes =
                Reflect.getMetadata('design:paramtypes', controllerClass) || [];

            const instances = paramTypes.map((paramType: any) =>
                application.providersMap.get(paramType.name),
            );

            const controllerInstance = new controllerClass(...instances);

            metadata.consumes.forEach(consumeMetadata => {
                const { message, handlerName, params } = consumeMetadata;

                instance.registeredConsumers.set(message, {
                    instance: controllerInstance,
                    handlerName,
                    params,
                });
            });

            const channelWrapper = instance.queueConn.createChannel({
                json: true,
                name: metadata.queueName,
                setup: channel => {
                    const promises = metadata.consumes.map(consume => {
                        const pubSub = metadata.pubSub === true;
                        const exclusive = metadata.exclusive === true;
                        const autoDelete = metadata.autoDelete === true;
                        const exchangeName =
                            metadata.exchangeName || 'exchange-name';

                        if (pubSub) {
                            return Promise.all([
                                channel.assertQueue(consume.message, {
                                    exclusive,
                                    autoDelete,
                                    durable: true,
                                }),
                                channel.assertExchange(exchangeName, 'topic'),
                                channel.prefetch(1),
                                channel.bindQueue(
                                    consume.message,
                                    exchangeName,
                                    '#',
                                ),
                                channel.consume(consume.message, async msg => {
                                    if (msg) {
                                        try {
                                            await instance.processMessage(
                                                channel,
                                                consume.message,
                                                JSON.parse(
                                                    msg.content.toString(),
                                                ),
                                            );
                                            channel.ack(msg); // Acknowledge the message
                                        } catch (error) {
                                            await instance.processMessage(
                                                channel,
                                                consume.message,
                                                msg.content,
                                            );
                                            channel.ack(msg);
                                        }
                                    }
                                }),
                            ]);
                        } else {
                            return Promise.all([
                                channel.assertQueue(consume.message, {
                                    exclusive,
                                    autoDelete,
                                    durable: true,
                                }),
                                channel.consume(consume.message, async msg => {
                                    if (msg) {
                                        try {
                                            await instance.processMessage(
                                                channel,
                                                consume.message,
                                                JSON.parse(
                                                    msg.content.toString(),
                                                ),
                                            );
                                            channel.ack(msg); // Acknowledge the message
                                        } catch (error) {
                                            await instance.processMessage(
                                                channel,
                                                consume.message,
                                                msg.content,
                                            );
                                            channel.ack(msg);
                                        }
                                    }
                                }),
                            ]);
                        }
                    });

                    return Promise.all(promises);
                },
            });

            await channelWrapper.waitForConnect();
            instance.channels.set(metadata.queueName, channelWrapper);
        });
    }

    private async setupKafka(
        application: Application,
        kafka: Kafka,
    ): Promise<void> {
        const instance = QueueService.getInstance();
        const queues: any = QueueRegistry.getQueues();

        queues.forEach(async ([controllerClass, metadata]) => {
            const paramTypes =
                Reflect.getMetadata('design:paramtypes', controllerClass) || [];

            const instances = paramTypes.map((paramType: any) =>
                application.providersMap.get(paramType.name),
            );

            const controllerInstance = new controllerClass(...instances);

            metadata.consumes.forEach(async consumeMetadata => {
                const { message, handlerName, params } = consumeMetadata;

                instance.registeredConsumers.set(message, {
                    instance: controllerInstance,
                    handlerName,
                    params,
                });

                const consumer = kafka.consumer({
                    groupId: `${metadata.queueName}-${message}`,
                });
                await consumer.connect();
                await consumer.subscribe({
                    topic: message,
                    fromBeginning: true,
                });

                consumer.run({
                    eachMessage: async ({ message }) => {
                        try {
                            const data = JSON.parse(message.value.toString());
                            await instance.processMessage(
                                null,
                                message.value.toString(),
                                data,
                            );
                        } catch (error) {
                            instance.logger.error(error.message);
                        }
                    },
                });

                instance.kafkaConsumers.push(consumer);
            });
        });
    }

    private async setupRedis(application: Application): Promise<void> {
        const instance = QueueService.getInstance();
        const queues: any = QueueRegistry.getQueues();

        queues.forEach(([controllerClass, metadata]) => {
            const paramTypes =
                Reflect.getMetadata('design:paramtypes', controllerClass) || [];

            const instances = paramTypes.map((paramType: any) =>
                application.providersMap.get(paramType.name),
            );

            const controllerInstance = new controllerClass(...instances);

            metadata.consumes.forEach(consumeMetadata => {
                const { message, handlerName, params } = consumeMetadata;

                instance.registeredConsumers.set(message, {
                    instance: controllerInstance,
                    handlerName,
                    params,
                });

                instance.redisClient.subscribe(
                    message,
                    async (channel, data: any) => {
                        try {
                            const parsedData = JSON.parse(data);
                            await instance.processMessage(
                                null,
                                channel.toString(),
                                parsedData,
                            );
                        } catch (error) {
                            instance.logger.error(error.message);
                        }
                    },
                );
            });
        });
    }

    private async processMessage(
        channel: any,
        queueName: string,
        data: any,
    ): Promise<void> {
        const consumer = this.registeredConsumers.get(queueName);

        if (consumer) {
            const { instance, handlerName, params } = consumer;

            const args = params
                .sort((a, b) => a.index - b.index)
                .map(param => {
                    switch (param.paramType) {
                        case 'message':
                            return data;
                        case 'queueName':
                            return queueName;
                        case 'channel':
                            return channel;
                        default:
                            return undefined;
                    }
                });

            try {
                await instance[handlerName](...args);
            } catch (e) {
                this.logger.error(`Error in handler: ${e.message}`);
            }
        } else {
            this.logger.log(`No consumer registered for queue: ${queueName}`);
        }
    }

    public async send(
        channelName: string,
        queueName: string,
        data: any,
    ): Promise<boolean> {
        try {
            const instance = QueueService.getInstance();
            const queueType = Config.get<string>('queue.type', 'rabbitmq');

            if (instance.channels.has(channelName)) {
                switch (queueType) {
                    case 'rabbitmq':
                        if (instance.channels.has(channelName)) {
                            const channel =
                                await instance.channels.get(channelName);
                            return await channel.sendToQueue(queueName, data);
                        }
                        break;
                    case 'kafka':
                        if (instance.kafkaProducer) {
                            await instance.kafkaProducer.send({
                                topic: queueName,
                                messages: [{ value: JSON.stringify(data) }],
                            });

                            return true;
                        }
                        break;
                    case 'redis':
                        if (instance.redisClient) {
                            await instance.redisClient.rpush(
                                queueName,
                                JSON.stringify(data),
                            );
                            return true;
                        }
                        break;
                    default:
                        throw new Error(`Unsupported queue type: ${queueType}`);
                }
            }

            return false;
        } catch (e) {
            return false;
        }
    }

    public async publish(
        channelName: string,
        exchangeName: string,
        data: any,
        persistent: boolean = true,
    ) {
        try {
            const instance = QueueService.getInstance();
            const queueType = Config.get<string>('queue.type', 'rabbitmq');

            if (instance.channels.has(channelName)) {
                const channel = await instance.channels.get(channelName);

                switch (queueType) {
                    case 'rabbitmq':
                        if (instance.channels.has(channelName)) {
                            const channel =
                                await instance.channels.get(channelName);
                            return channel.publish(
                                exchangeName,
                                '',
                                Buffer.from(JSON.stringify(data)),
                                {
                                    contentType: 'application/json',
                                    persistent,
                                },
                            );
                        }
                        break;
                    case 'kafka':
                        if (instance.kafkaProducer) {
                            await instance.kafkaProducer.send({
                                topic: exchangeName,
                                messages: [{ value: JSON.stringify(data) }],
                            });
                            return true;
                        }
                        break;
                    case 'redis':
                        if (instance.redisClient) {
                            await instance.redisClient.publish(
                                exchangeName,
                                JSON.stringify(data),
                            );
                            return true;
                        }
                        break;
                    default:
                        throw new Error(`Unsupported queue type: ${queueType}`);
                }
            }

            return false;
        } catch (e) {
            return false;
        }
    }
}
