// Test message fixtures
export const validMessages = {
    simple: {
        task: 'simple-task',
        data: 'test-data',
    },

    complex: {
        task: 'complex-task',
        metadata: {
            userId: '123',
            timestamp: Date.now(),
        },
        data: {
            items: [1, 2, 3],
            nested: {
                field: 'value',
            },
        },
    },

    priority: {
        task: 'priority-task',
        priority: 9,
    },

    withRetry: {
        task: 'retry-task',
        maxRetries: 3,
    },

    large: {
        task: 'large-task',
        data: new Array(1000).fill('x').join(''),
    },

    unicode: {
        task: 'unicode-task',
        text: '你好世界 🌍 مرحبا بالعالم',
    },
};

export const invalidMessages = {
    null: null,
    undefined: undefined,
    emptyObject: {},
    emptyString: '',
};

export const queueMessages = {
    email: {
        type: 'email',
        to: 'user@example.com',
        subject: 'Test Email',
        body: 'Test message body',
    },

    notification: {
        type: 'notification',
        userId: '123',
        title: 'New Message',
        body: 'You have a new message',
    },

    task: {
        type: 'task',
        action: 'process-video',
        videoId: 'video-123',
        options: {
            quality: 'hd',
            format: 'mp4',
        },
    },
};
