// Mock for ioredis
import { EventEmitter } from 'events';

export default class MockRedis extends EventEmitter {
    public connected: boolean = false;
    public subscriptions: Map<string, Set<Function>> = new Map();
    public publishedMessages: Array<{ channel: string; message: string }> = [];
    public listData: Map<string, string[]> = new Map();

    constructor(url?: string | object) {
        super();
        setTimeout(() => {
            this.connected = true;
            this.emit('connect');
        }, 0);
    }

    subscribe(channel: string, callback?: Function) {
        if (!this.subscriptions.has(channel)) {
            this.subscriptions.set(channel, new Set());
        }

        if (callback) {
            this.subscriptions.get(channel)!.add(callback);
        }

        return Promise.resolve();
    }

    on(event: string, handler: Function) {
        super.on(event, handler);

        if (event === 'connect' && this.connected) {
            setImmediate(() => handler());
        }

        if (event === 'message') {
            // Store message handler for simulation
            if (!this.subscriptions.has('__messageHandler__')) {
                this.subscriptions.set('__messageHandler__', new Set());
            }
            this.subscriptions.get('__messageHandler__')!.add(handler);
        }

        return this;
    }

    publish(channel: string, message: string) {
        this.publishedMessages.push({ channel, message });

        // Trigger message handlers
        const handlers = this.subscriptions.get('__messageHandler__');
        if (handlers) {
            handlers.forEach(handler => {
                setImmediate(() => handler(channel, message));
            });
        }

        return Promise.resolve(1);
    }

    rpush(key: string, value: string) {
        if (!this.listData.has(key)) {
            this.listData.set(key, []);
        }
        this.listData.get(key)!.push(value);
        return Promise.resolve(this.listData.get(key)!.length);
    }

    lpop(key: string) {
        const list = this.listData.get(key);
        if (list && list.length > 0) {
            return Promise.resolve(list.shift());
        }
        return Promise.resolve(null);
    }

    blpop(key: string, timeout: number) {
        const list = this.listData.get(key);
        if (list && list.length > 0) {
            return Promise.resolve([key, list.shift()]);
        }
        return Promise.resolve(null);
    }

    quit() {
        this.connected = false;
        this.emit('end');
        return Promise.resolve('OK');
    }

    disconnect() {
        return this.quit();
    }

    // Helper methods for testing
    simulateMessage(channel: string, message: string) {
        const handlers = this.subscriptions.get('__messageHandler__');
        if (handlers) {
            handlers.forEach(handler => handler(channel, message));
        }
    }

    getPublishedMessages(channel?: string) {
        if (channel) {
            return this.publishedMessages.filter(m => m.channel === channel);
        }
        return this.publishedMessages;
    }

    clearPublishedMessages() {
        this.publishedMessages = [];
    }

    clearListData() {
        this.listData.clear();
    }
}
