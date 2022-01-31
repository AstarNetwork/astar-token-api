// For more info on how to configure Jest and Polkadot check
// https://polkadot.js.org/docs/usage/FAQ/#i-am-having-trouble-with-jest-esm-and-the-libraries
// jest.config.ts
import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
    testEnvironment: 'node',
    verbose: true,
    preset: 'ts-jest',
    transformIgnorePatterns: ['/node_modules/(?!@polkadot|@babel/runtime/helpers/esm/)'],
    transform: {
        '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
    },
};
export default config;
