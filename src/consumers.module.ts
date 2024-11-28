import { Module } from '@cmmv/core';

import { 
    SendEmailConsumer 
} from './consumers/sendemail.consumer';

export let ConsumersModule = new Module("consumers", {
    providers: [SendEmailConsumer],
});