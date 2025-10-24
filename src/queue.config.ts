import { ConfigSchema } from '@cmmv/core';

export const QueueConfig: ConfigSchema = {
    queue: {
        type: {
            required: true,
            type: 'string',
            default: 'rabbitmq',
        },
        url: {
            required: true,
            type: 'string',
            default: 'amqp://guest:guest@localhost:5672/cmmv',
        },
        synap: {
            required: false,
            type: 'object',
            default: {},
        },
    },
};
