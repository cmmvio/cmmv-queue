# Implementation Tasks

## 1. Dependency and Configuration
- [ ] 1.1 Add `@hivellm/synap` dependency to `package.json`
- [ ] 1.2 Run `pnpm install` to install Synap SDK
- [ ] 1.3 Add Synap configuration options to `queue.config.ts`
- [ ] 1.4 Add Synap type definitions to `queue.interface.ts`
- [ ] 1.5 Update `.cmmv.config.js` example with Synap configuration

## 2. Synap Adapter Implementation
- [ ] 2.1 Create `src/queue.synap.ts` adapter file
- [ ] 2.2 Implement Synap client initialization
- [ ] 2.3 Implement authentication handling (Basic Auth + API Key)
- [ ] 2.4 Implement queue creation (`createQueue`)
- [ ] 2.5 Implement message publishing (`publishString`, `publishJSON`)
- [ ] 2.6 Implement message consumption (`consumeJSON`)
- [ ] 2.7 Implement ACK operation
- [ ] 2.8 Implement NACK operation
- [ ] 2.9 Implement pub/sub publish for broadcast mode
- [ ] 2.10 Implement pub/sub subscribe for broadcast mode

## 3. QueueService Integration
- [ ] 3.1 Add Synap case to `loadConfig()` switch statement
- [ ] 3.2 Implement `setupSynap()` method
- [ ] 3.3 Handle Synap queue registration from QueueRegistry
- [ ] 3.4 Implement consumer handler execution for Synap
- [ ] 3.5 Add Synap connection error handling
- [ ] 3.6 Implement graceful disconnect for Synap

## 4. Queue Operations
- [ ] 4.1 Implement `send()` for Synap (point-to-point)
- [ ] 4.2 Implement `publish()` for Synap (pub/sub)
- [ ] 4.3 Handle message serialization (JSON)
- [ ] 4.4 Handle message deserialization
- [ ] 4.5 Support priority queues (0-9 priority mapping)
- [ ] 4.6 Support retry configuration
- [ ] 4.7 Support max_retries option

## 5. Parameter Injection
- [ ] 5.1 Map @QueueMessage() to Synap message data
- [ ] 5.2 Map @QueueChannel() to Synap queue instance (or null)
- [ ] 5.3 Map @QueueConn() to Synap client connection
- [ ] 5.4 Handle parameter index ordering correctly

## 6. Channel Options Mapping
- [ ] 6.1 Map `pubSub: true` to Synap pub/sub system
- [ ] 6.2 Map `pubSub: false` to Synap queue system
- [ ] 6.3 Map `exchangeName` to topic name for pub/sub
- [ ] 6.4 Map `durable` option (Synap queues are durable by default)
- [ ] 6.5 Map `exclusive` option (if applicable)
- [ ] 6.6 Handle unsupported options gracefully

## 7. Error Handling
- [ ] 7.1 Handle Synap connection errors
- [ ] 7.2 Handle authentication errors
- [ ] 7.3 Handle queue creation errors
- [ ] 7.4 Handle message publish errors
- [ ] 7.5 Handle consumption errors
- [ ] 7.6 Add structured error logging
- [ ] 7.7 Implement retry logic for transient failures

## 8. Health and Monitoring
- [ ] 8.1 Implement health check using Synap client
- [ ] 8.2 Track connection state (connected, disconnected, error)
- [ ] 8.3 Add metrics collection (messages sent, received, failed)
- [ ] 8.4 Log connection events (connect, disconnect, error)

## 9. Documentation
- [ ] 9.1 Add Synap section to README.md
- [ ] 9.2 Add Synap configuration example
- [ ] 9.3 Add Synap usage examples
- [ ] 9.4 Document Synap-specific features
- [ ] 9.5 Add comparison table (Synap vs RabbitMQ vs Kafka vs Redis)
- [ ] 9.6 Add migration guide from other queues to Synap
- [ ] 9.7 Document authentication options
- [ ] 9.8 Add troubleshooting section for Synap

## 10. Sample Application
- [ ] 10.1 Create `sample/consumers/synap.consumer.ts`
- [ ] 10.2 Create `.cmmv.config.synap.js` example
- [ ] 10.3 Add Synap queue example
- [ ] 10.4 Add Synap pub/sub example
- [ ] 10.5 Add README for running Synap examples

## 11. Testing
- [ ] 11.1 Add unit tests for Synap adapter
- [ ] 11.2 Add integration tests with Synap server
- [ ] 11.3 Test queue creation and deletion
- [ ] 11.4 Test message publish and consume
- [ ] 11.5 Test ACK/NACK operations
- [ ] 11.6 Test pub/sub functionality
- [ ] 11.7 Test authentication (Basic + API Key)
- [ ] 11.8 Test error scenarios
- [ ] 11.9 Test graceful shutdown
- [ ] 11.10 Add performance benchmarks vs other queue types

## 12. Type Safety
- [ ] 12.1 Export Synap types from SDK
- [ ] 12.2 Add type guards for Synap messages
- [ ] 12.3 Ensure TypeScript strict mode compatibility
- [ ] 12.4 Add JSDoc for Synap-specific methods

## 13. Advanced Features (Optional)
- [ ] 13.1 Support reactive consumption with RxJS (optional)
- [ ] 13.2 Support Synap event streams (beyond basic queue)
- [ ] 13.3 Support dead letter queue (Synap built-in)
- [ ] 13.4 Support message compression (Synap built-in)
- [ ] 13.5 Add connection pooling configuration

## 14. Release Preparation
- [ ] 14.1 Update CHANGELOG.md with Synap support
- [ ] 14.2 Bump version to 0.9.0 (minor feature addition)
- [ ] 14.3 Test with all existing queue types (ensure no regression)
- [ ] 14.4 Update package description to mention Synap
- [ ] 14.5 Add Synap to keywords in package.json
- [ ] 14.6 Create release notes

## 15. CI/CD
- [ ] 15.1 Add Synap to CI test matrix (optional)
- [ ] 15.2 Add Synap server to test environment
- [ ] 15.3 Update GitHub Actions workflow
- [ ] 15.4 Add automated Synap integration tests

