/**
 * Example CMMV Configuration for Synap Queue
 *
 * Copy this file to .cmmv.config.js and configure for your Synap server
 */

module.exports = {
    env: process.env.NODE_ENV || 'development',

    queue: {
        // Use Synap as queue system
        type: 'synap',

        // Synap server URL
        url: process.env.SYNAP_URL || 'http://localhost:15500',

        // Synap-specific configuration
        synap: {
            // Request timeout in milliseconds
            timeout: 10000,

            // Enable debug logging
            debug: false,

            // Polling interval for queue consumption (ms)
            pollingInterval: 1000,

            // Max concurrent message processing
            concurrency: 5,

            // Authentication (optional)
            auth: {
                // 'basic' for username/password or 'api_key' for API key
                type: 'api_key',

                // For API key authentication
                apiKey: process.env.SYNAP_API_KEY || 'sk_your_api_key_here',

                // For basic authentication (alternative)
                // type: 'basic',
                // username: 'admin',
                // password: 'your-password'
            }
        }
    }
};

/**
 * Synap Performance Benefits:
 *
 * - 100x faster queue operations vs RabbitMQ
 * - 120x faster KV reads vs Redis
 * - Single service replaces RabbitMQ + Kafka + Redis
 * - Built-in ACK/NACK, retries, dead letter queues
 * - Master-slave replication
 * - 99.30% test coverage
 *
 * Learn more: https://github.com/hivellm/synap
 */

