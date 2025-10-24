// Mock for @cmmv/core Config
export class MockConfig {
    private static config: Map<string, any> = new Map();

    static get<T = any>(key: string, defaultValue?: T): T {
        const keys = key.split('.');
        let value: any = this.config;

        for (const k of keys) {
            if (value instanceof Map) {
                value = value.get(k);
            } else if (typeof value === 'object' && value !== null) {
                value = value[k];
            } else {
                return defaultValue as T;
            }

            if (value === undefined) {
                return defaultValue as T;
            }
        }

        return value as T;
    }

    static set(key: string, value: any): void {
        const keys = key.split('.');
        const lastKey = keys.pop()!;
        let current: any = this.config;

        for (const k of keys) {
            if (!current.has(k)) {
                current.set(k, new Map());
            }
            current = current.get(k);
        }

        current.set(lastKey, value);
    }

    static clear(): void {
        this.config = new Map();
    }

    static reset(): void {
        this.clear();
    }
}
