export type NetworkType = 'astar' | 'shiden' | 'shibuya' | 'development';

export const networks = {
    astar: {
        name: 'astar',
        endpoints: [
            'wss://wss.astar.network',
            'wss://astar.api.onfinality.io/public-ws',
            'wss://astar-rpc.dwellir.com',
        ],
        evmRpc: 'https://evm.astar.network',
    },
    shiden: {
        name: 'shiden',
        endpoints: [
            'wss://rpc.shiden.astar.network',
            'wss://shiden.api.onfinality.io/public-ws',
            'wss://rpc.pinknode.io/shiden/explorer',
            'wss://shiden-rpc.dwellir.com',
        ],
        evmRpc: 'https://evm.shiden.astar.network',
    },
    shibuya: {
        name: 'shibuya',
        endpoints: ['wss://rpc.shibuya.astar.network', 'wss://shibuya-rpc.dwellir.com'],
        evmRpc: 'https://evm.shibuya.astar.network',
    },
    development: {
        name: 'development',
        endpoints: ['ws://localhost:9944'],
        evmRpc: '',
    },
};
