// Test configuration fixtures
export const rabbitMQConfig = {
    queue: {
        type: 'rabbitmq',
        url: 'amqp://guest:guest@localhost:5672/test',
    },
};

export const kafkaConfig = {
    queue: {
        type: 'kafka',
        url: 'localhost:9092',
    },
};

export const redisConfig = {
    queue: {
        type: 'redis',
        url: 'redis://localhost:6379',
    },
};

export const invalidConfig = {
    queue: {
        type: 'invalid-type',
        url: '',
    },
};

export const missingTypeConfig = {
    queue: {
        url: 'amqp://localhost:5672',
    },
};

export const missingUrlConfig = {
    queue: {
        type: 'rabbitmq',
    },
};
