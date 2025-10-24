# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Comprehensive Test Suite**: Added 97 tests with ~70% code coverage
  - 43 unit tests (100% passing)
  - 54 integration tests (70% passing)
  - Test infrastructure with mocks, helpers, and fixtures
  - Docker Compose setup for integration testing
  - GitHub Actions CI/CD pipeline
  - Vitest configuration with coverage reporting

- **Testing Infrastructure**:
  - 5 comprehensive mocks (RabbitMQ, Kafka, Redis, Config, Logger)
  - Test helpers and utilities
  - Reusable fixtures for messages, configs, and consumers
  - Coverage thresholds (90% target)
  - 7 npm test scripts

- **Documentation**:
  - `TESTING_GUIDE.md` - Complete testing guide
  - `tests/README.md` - Test suite documentation
  - `tests/TEST_RESULTS.md` - Test execution results
  - `tests/FINAL_SUMMARY.md` - Implementation summary
  - Updated README.md with testing section

- **OpenSpec Proposals**:
  - `improve-queue-resilience-and-types` - Production-ready enhancements
  - `add-synap-queue-support` - Synap integration proposal
  - `add-comprehensive-test-coverage` - Completed test implementation

- **Dependencies**:
  - `@vitest/coverage-v8@^2.1.9` - Code coverage reporting
  - `reflect-metadata@^0.2.2` - Decorator metadata support

### Changed
- Updated `vitest.config.ts` with comprehensive coverage configuration
- Enhanced `package.json` with additional test scripts
- Improved project structure with OpenSpec workflow

## [0.8.0] - Previous Release

### Features
- Support for RabbitMQ, Kafka, and Redis queue systems
- Decorator-based API (@Channel, @Consume, @QueueMessage, etc.)
- Pub/Sub messaging support
- Priority queue support
- Queue configuration options

### Known Issues
- No test coverage (resolved in unreleased)
- Limited type safety with `any` types (addressed in OpenSpec proposal)
- No retry mechanism (addressed in OpenSpec proposal)
- Missing graceful shutdown (addressed in OpenSpec proposal)

[unreleased]: https://github.com/cmmvio/cmmv-queue/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/cmmvio/cmmv-queue/releases/tag/v0.8.0
