import { Application } from '@cmmv/core';
import { DefaultAdapter, DefaultHTTPModule } from '@cmmv/http';
import { QueueModule, QueueService } from '../src';

import { ConsumersModule } from './consumers.module';

Application.create({
    httpAdapter: DefaultAdapter,
    modules: [DefaultHTTPModule, QueueModule, ConsumersModule],
    services: [QueueService],
});
