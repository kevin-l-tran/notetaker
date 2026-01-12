import { defineConfig, mergeConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

import viteConfig from "./vite.config";
import path from "node:path";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname =
    typeof __dirname !== "undefined"
        ? __dirname
        : path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            projects: [
                {
                    extends: true,
                    test: {
                        name: "unit",
                        include: ["src/**/*.{test,spec}.{ts,tsx}"],
                        exclude: ["src/**/*.integration.test.{ts,tsx}"],
                    },
                },
                {
                    extends: true,
                    test: {
                        name: "integration",
                        include: ["src/**/*.integration.test.{ts,tsx}"],
                        setupFiles: ["./src/setupTests.ts"],
                        environment: "jsdom",
                    },
                },
                {
                    extends: true,
                    plugins: [
                        storybookTest({
                            configDir: path.join(dirname, ".storybook"),
                        }),
                    ],
                    test: {
                        name: "storybook",
                        browser: {
                            enabled: true,
                            headless: true,
                            provider: playwright({}),
                            instances: [{ browser: "chromium" }],
                        },
                        setupFiles: [".storybook/vitest.setup.ts"],
                    },
                },
            ],
        },
    })
);
