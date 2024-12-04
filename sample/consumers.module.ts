import { Module } from '@cmmv/core';

import { HelloWorldConsumer } from './consumers/helloworld.consumer';

import { SamplePubSubConsumer } from './consumers/samplepubsub.consumer';

export let ConsumersModule = new Module('consumers', {
    providers: [HelloWorldConsumer, SamplePubSubConsumer],
});
