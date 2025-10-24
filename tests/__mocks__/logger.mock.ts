// Mock for @cmmv/core Logger
export class MockLogger {
    public logs: Array<{ level: string; message: string; data?: any }> = [];

    log(message: string, data?: any): void {
        this.logs.push({ level: 'log', message, data });
    }

    error(message: string, data?: any): void {
        this.logs.push({ level: 'error', message, data });
    }

    warn(message: string, data?: any): void {
        this.logs.push({ level: 'warn', message, data });
    }

    debug(message: string, data?: any): void {
        this.logs.push({ level: 'debug', message, data });
    }

    info(message: string, data?: any): void {
        this.logs.push({ level: 'info', message, data });
    }

    clear(): void {
        this.logs = [];
    }

    getLogs(
        level?: string,
    ): Array<{ level: string; message: string; data?: any }> {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return this.logs;
    }

    hasLog(message: string, level?: string): boolean {
        return this.logs.some(
            log =>
                log.message.includes(message) &&
                (!level || log.level === level),
        );
    }
}
