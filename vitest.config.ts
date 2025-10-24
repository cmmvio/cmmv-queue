import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json', 'lcov'],
            exclude: [
                '**/*.spec.ts',
                '**/__mocks__/**',
                'tests/**',
                'sample/**',
                'dist/**',
                'node_modules/**',
            ],
            thresholds: {
                statements: 90,
                branches: 85,
                functions: 90,
                lines: 90,
            },
        },
        include: ['tests/**/*.spec.ts'],
        exclude: ['node_modules', 'dist', 'sample'],
    },
});
