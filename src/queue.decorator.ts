import { QueueRegistry } from './queue.registry';
import { QueueOptions } from './queue.interface';

export function Channel(
    queueName: string,
    options?: QueueOptions,
): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata('channel_queue', queueName, target);
        Reflect.defineMetadata('channel_options', options, target);
        QueueRegistry.registerChannel(target, queueName, options);
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
