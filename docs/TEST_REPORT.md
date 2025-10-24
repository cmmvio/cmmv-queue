# Test Report - @cmmv/queue

**Date:** 2025-10-24  
**Total Tests:** 109 tests  
**Duration:** 157.22s

## Summary

| Category | Passed | Failed | Total | Success Rate |
|----------|--------|--------|-------|--------------|
| **Unit Tests** | 43 | 0 | 43 | ✅ 100% |
| **Integration Tests** | 48 | 18 | 66 | ⚠️ 73% |
| **TOTAL** | **91** | **18** | **109** | **83%** |

## Unit Tests ✅ (100%)

All unit tests passed successfully:

- **QueueRegistry** (23 tests) ✅
- **Queue Decorators** (17 tests) ✅  
- **QueueService** (3 tests) ✅

## Integration Tests (73%)

### Synap Integration ⚠️ (75% - 9/12 passed)

**Passed:**
- ✅ Queue creation and publishing (PASS)
- ✅ Message consumption with ACK (PASS)
- ✅ Message consumption with NACK (PASS)
- ✅ Multiple queues handling (PASS)
- ✅ Topic subscription (PASS)
- ✅ Multiple topic subscriptions (PASS)
- ✅ Multiple consumers on same queue (PASS)
- ✅ Large message handling (PASS)
- ✅ Rapid publishing performance (467 msg/s) (PASS)

**Failed:**
- ❌ Pub/Sub publishing - `Network error: Invalid request: Missing 'payload' field`
- ❌ Multiple topics pub/sub - `Network error: Invalid request: Missing 'payload' field`
- ❌ Non-existent queue error handling - `Network error: Queue not found: non-existent-queue-xyz`

**Issues:**
- Pub/Sub operations need payload field adjustment in adapter
- Error handling for non-existent queues needs improvement

---

### Redis Integration ⚠️ (92% - 22/24 passed)

**Passed:**
- ✅ Pub/Sub messaging (subscribe, publish, unsubscribe, multiple channels)
- ✅ List-based queues (RPUSH/LPOP, BLPOP timeout)
- ✅ JSON message handling
- ✅ Multiple queues
- ✅ Large messages
- ✅ Concurrent operations
- ✅ Message expiration (TTL)
- ✅ Pipeline operations

**Failed:**
- ❌ BLPOP blocking behavior - Test timeout (5000ms)
- ❌ Connection reconnection - `Redis is already connecting/connected`

**Issues:**
- BLPOP test needs timeout adjustment or async handling fix
- Reconnection test conflicts with active connection

---

### Kafka Integration ⚠️ (79% - 11/14 passed)

**Passed:**
- ✅ Message production (single, batch, large messages)
- ✅ Message consumption (from beginning)
- ✅ Consumer groups (distribution)
- ✅ Offset management (auto-commit)
- ✅ Partitions (distribution, ordering)
- ✅ Error handling (retry on failures)

**Failed:**
- ❌ Consume only new messages - `expected [] to include 'new-1'`
- ❌ Consumer group rebalancing - `expected 0 to be greater than 0`
- ❌ Non-existent topic handling - `promise resolved instead of rejecting`

**Issues:**
- fromBeginning=false configuration not working correctly
- Rebalancing test timing/logic needs adjustment
- Error handling for non-existent topics not throwing expected error

---

### RabbitMQ Integration ❌ (38% - 6/16 passed)

**Passed:**
- ✅ Basic queue creation and message publishing (PASS)
- ✅ Handling large messages (PASS)
- ✅ High prefetch limit (PASS)
- ✅ Low prefetch limit (PASS)
- ✅ Multiple message consumption (partial)
- ✅ Connection recovery after failure (PASS)

**Failed:**
- ❌ Multiple messages handling - `Channel ended, no reply will be forthcoming`
- ❌ Message order preservation - Test timeout (30000ms)
- ❌ ACK behavior - Test timeout (5000ms)
- ❌ NACK/requeue behavior - Test timeout (30000ms)
- ❌ Priority queues - Test timeout (30000ms)
- ❌ Pub/Sub with exchanges - `Not connected`
- ❌ Topic routing - Test timeout (30000ms)
- ❌ Message TTL - Test timeout (20000ms)
- ❌ Dead Letter Exchange - Test timeout (30000ms)
- ❌ Temporary disconnection - `Channel closed`

**Critical Issues:**
- Channel management causing disconnections
- Queue naming/vhost conflicts (`NOT_FOUND - no queue 'test-queue-pubsub' in vhost '/'`)
- Connection stability issues
- 33 unhandled rejections related to queue not found errors

**Root Causes:**
1. Queue cleanup between tests not working properly
2. Channel lifecycle management issues
3. Vhost configuration mismatch (using `/test` but some tests expect `/`)
4. Async timing issues causing timeouts

## Performance Highlights 🚀

- **Synap Throughput:** 467 msg/s (100 messages in 214ms)
- **All Integration Tests:** Completed in ~157s
- **Unit Tests:** Very fast execution (<50ms total)

## Recommendations

### High Priority
1. **Fix RabbitMQ tests** - Major issues with channel management and queue lifecycle
2. **Synap Pub/Sub** - Add proper payload field to adapter
3. **Kafka consume behavior** - Fix `fromBeginning=false` configuration

### Medium Priority
4. **Redis reconnection test** - Refactor to avoid connection conflicts
5. **Test isolation** - Improve cleanup between tests
6. **Timeout configurations** - Adjust for async operations

### Low Priority
7. **Error handling** - Improve validation and error messages
8. **Test documentation** - Add comments for complex test scenarios
9. **CI/CD** - Configure test retries for flaky tests

## Coverage Goals

Current coverage is estimated at ~60-70% based on test distribution:
- **Target:** 90% statements, 85% branches
- **Action:** Run `pnpm run test:coverage` for detailed metrics

## Next Steps

1. Fix RabbitMQ channel management issues
2. Update Synap adapter pub/sub implementation
3. Investigate Kafka fromBeginning behavior
4. Run coverage report to identify gaps
5. Update CI/CD to mark flaky tests

---

**Note:** RabbitMQ failures are the highest priority as they represent the majority of failing tests. The underlying issue appears to be related to queue/channel lifecycle management and vhost configuration.

