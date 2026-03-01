import type { Config } from "jest";

const config: Config = {
  // Use ts-jest to compile TypeScript — no Babel, no React transform needed
  preset: "ts-jest",

  // Pure Node environment — tests call engine functions directly, no browser/React
  testEnvironment: "node",

  // Use the test-specific tsconfig (commonjs + node moduleResolution)
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },

  // Resolve the @/* path alias to the workspace root
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  // Only run files inside __tests__ folders with .test.ts(x) extension
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],

  // Show each test name in the output
  verbose: true,
};

export default config;
