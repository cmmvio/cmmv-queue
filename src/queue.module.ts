import { Module } from '@cmmv/core';

import { QueueConfig } from './queue.config';
import { QueueService } from './queue.service';

export const QueueModule = new Module('queue', {
    configs: [QueueConfig],
    providers: [QueueService],
});
