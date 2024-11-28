import { Module } from '@cmmv/core';
import { QueueService } from "../services/queue.service";

export const QueueModule = new Module('queue', {
    providers: [QueueService]
});
