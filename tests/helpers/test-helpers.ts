// Test helper utilities
export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function createMockApplication(): any {
    return {
        providersMap: new Map(),
    };
}

export function expectToContainMessage(messages: any[], expected: any): void {
    const found = messages.some(msg =>
        Object.keys(expected).every(key => msg[key] === expected[key]),
    );

    if (!found) {
        throw new Error(
            `Expected messages to contain ${JSON.stringify(expected)}`,
        );
    }
}

export function expectMessageCount(
    messages: any[],
    count: number,
    message?: string,
): void {
    if (messages.length !== count) {
        throw new Error(
            message || `Expected ${count} messages, got ${messages.length}`,
        );
    }
}

export async function waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    checkInterval: number = 100,
): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await wait(checkInterval);
    }

    throw new Error('Condition not met within timeout');
}
