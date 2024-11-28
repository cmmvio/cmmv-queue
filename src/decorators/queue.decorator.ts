import { QueueRegistry } from '../registries/queue.registry';

export function Channel(queueName: string): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata('channel_queue', queueName, target);
        QueueRegistry.registerChannel(target, queueName);
    };
}

function createConsumeDecorator(message: string): MethodDecorator {
    return (target, propertyKey: string | symbol) => {
        QueueRegistry.registerConsumeHandler(
            target,
            message,
            propertyKey as string,
        );
    };
}

export function Consume(message: string): MethodDecorator {
    return createConsumeDecorator(message);
}

export function QueueMessage(): ParameterDecorator {
    return (target, propertyKey: string | symbol, parameterIndex: number) => {
        QueueRegistry.registerParam(
            target,
            propertyKey as string,
            'message',
            parameterIndex,
        );
    };
}

export function QueueConn(): ParameterDecorator {
    return (target, propertyKey: string | symbol, parameterIndex: number) => {
        QueueRegistry.registerParam(
            target,
            propertyKey as string,
            'conn',
            parameterIndex,
        );
    };
}

export function QueueChannel(): ParameterDecorator {
    return (target, propertyKey: string | symbol, parameterIndex: number) => {
        QueueRegistry.registerParam(
            target,
            propertyKey as string,
            'channel',
            parameterIndex,
        );
    };
}

