export interface QueueOptions {
    exchangeName?: string;
    pubSub?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
    durable?: boolean;
}

export interface SynapAuthConfig {
    type: 'basic' | 'api_key';
    username?: string;
    password?: string;
    apiKey?: string;
}

export interface SynapConfig {
    timeout?: number;
    debug?: boolean;
    pollingInterval?: number;
    concurrency?: number;
    auth?: SynapAuthConfig;
}
