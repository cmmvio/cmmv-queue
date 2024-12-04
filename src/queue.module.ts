import { Module } from '@cmmv/core';
import { QueueService } from './queue.service';

export const QueueModule = new Module('queue', {
    providers: [QueueService],
});
