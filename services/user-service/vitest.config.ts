import { configDefaults, defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            enabled: true,
            exclude: [],

        },
        hookTimeout: 20000,
        clearMocks: true,
        exclude: [...configDefaults.exclude, 'build', "coverage/**"],
    },
    plugins: [tsconfigPaths()],
})