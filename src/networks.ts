export type NetworkType = 'astar' | 'shiden' | 'shibuya';

export const networks = {
    astar: {
        name: 'astar',
        endpoint: 'wss://wss.astar.network',
        evmRpc: 'https://evm.astar.network',
    },
    shiden: {
        name: 'shiden',
        endpoint: 'wss://rpc.shiden.astar.network',
        evmRpc: 'https://evm.shiden.astar.network',
    },
    shibuya: {
        name: 'shibuya',
        endpoint: 'wss://rpc.shibuya.astar.network',
        evmRpc: 'https://evm.shibuya.astar.network',
    },
    development: {
        name: 'development',
        endpoint: 'ws://localhost:9944',
        evmRpc: '',
    },
};
