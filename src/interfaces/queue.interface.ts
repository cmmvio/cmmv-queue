export interface QueueOptions {
    exchangeName?: string;
    pubSub?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
    durable?: boolean;
}