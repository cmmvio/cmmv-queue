export class QueueRegistry {
    public static queues = new Map<
        any,
        {
            queueName: string;
            exchangeName: string;
            pubSub: boolean;
            durable: boolean;
            autoDelete: boolean;
            exclusive: boolean;
            consumes: any[];
        }
    >();

    public static registerChannel(
        target: any,
        queueName: string,
        options: any,
    ) {
        const pubSub = options?.pubSub === true;
        const durable = options?.durable === true;
        const autoDelete = options?.autoDelete === true;
        const exclusive = options?.exclusive === true;
        const exchangeName = options?.exchangeName || 'exchange-name';

        if (!this.queues.has(target)) {
            this.queues.set(target, {
                queueName,
                consumes: [],
                pubSub,
                durable,
                autoDelete,
                exclusive,
                exchangeName,
            });
        } else {
            this.queues.set(target, {
                ...this.queues.get(target),
                queueName,
                pubSub,
                durable,
                autoDelete,
                exclusive,
                exchangeName,
            });
        }
    }

    public static registerConsumeHandler(
        target: any,
        message: string,
        handlerName: string,
    ) {
        let queue = this.queues.get(target.constructor);

        if (!queue) {
            const queueName =
                Reflect.getMetadata('channel_queue', target.constructor) || '';
            const options =
                Reflect.getMetadata('channel_options', target.constructor) ||
                {};
            this.registerChannel(target.constructor, queueName, options);
            queue = this.queues.get(target.constructor);
        }

        if (queue) {
            const handler = queue.consumes.find(
                msg => msg.handlerName === handlerName,
            );

            if (!handler)
                queue.consumes.push({ message, handlerName, params: [] });
            else handler.message = message;
        }
    }

    public static registerParam(
        target: any,
        handlerName: string,
        paramType: string,
        index: number,
    ) {
        let queue = this.queues.get(target.constructor);

        if (!queue) {
            const queueName =
                Reflect.getMetadata('channel_queue', target.constructor) || '';
            const options =
                Reflect.getMetadata('channel_options', target.constructor) ||
                {};
            this.registerChannel(target.constructor, queueName, options);
            queue = this.queues.get(target.constructor);
        }

        if (queue) {
            let handler = queue.consumes.find(
                msg => msg.handlerName === handlerName,
            );

            if (!handler) {
                handler = { message: '', handlerName, params: [] };
                queue.consumes.push(handler);
            }

            handler.params = handler.params || [];
            handler.params.push({ paramType, index });
        } else {
            console.log(`${target.constructor.name} not found`);
        }
    }

    public static getQueues() {
        return Array.from(this.queues.entries());
    }

    public static getConsumes(target: any): any[] {
        const queues = this.queues.get(target);
        return queues ? queues.consumes : [];
    }

    public static getParams(target: any, handlerName: string): any[] {
        const queues = this.queues.get(target.constructor);

        if (!queues) return [];

        const handler = queues.consumes.find(
            msg => msg.handlerName === handlerName,
        );

        return handler ? handler.params : [];
    }

    public static clear() {
        QueueRegistry.queues = new Map<
            any,
            {
                queueName: string;
                exchangeName: string;
                pubSub: boolean;
                durable: boolean;
                autoDelete: boolean;
                exclusive: boolean;
                consumes: any[];
            }
        >();
    }
}
