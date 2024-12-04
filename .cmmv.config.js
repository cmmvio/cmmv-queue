module.exports = {
    env: process.env.NODE_ENV,

    server: {
        host: "127.0.0.1",
        port: 3000,
        compress: {
            enabled: true
        }
    },

    queue: {
        type: process.env.QUEUE_TYPE || "rabbitmq",
        url: process.env.QUEUE_URL || "amqp://guest:guest@localhost:5672/cmmv"
    }
};