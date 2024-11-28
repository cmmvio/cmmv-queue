import { Module } from '@cmmv/core';

import { 
    HelloWorldConsumer 
} from './consumers/helloworld.consumer';

export let ConsumersModule = new Module("consumers", {
    providers: [HelloWorldConsumer],
});