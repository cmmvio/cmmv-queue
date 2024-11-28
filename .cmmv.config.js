module.exports = {
    env: process.env.NODE_ENV,

    queue: {
        type: process.env.QUEUE_TYPE || "rabbitmq",
        url: process.env.QUEUE_URL || "amqp://guest:guest@localhost:5672/cmmv"
    }
};