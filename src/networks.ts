export type NetworkType = 'astar' | 'shiden' | 'shibuya' | 'rocstar' | 'development';

export const networks = {
    astar: {
        name: 'astar',
        endpoints: [
            'wss://wss.astar.network',
            'wss://astar.api.onfinality.io/public-ws',
            'wss://astar-rpc.dwellir.com',
        ],
        evmRpc: 'https://evm.astar.network',
        evmId: '592',
        token: 'ASTR',
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
        evmId: '336',
        token: 'SDN',
    },
    shibuya: {
        name: 'shibuya',
        endpoints: ['wss://rpc.shibuya.astar.network', 'wss://shibuya-rpc.dwellir.com'],
        evmRpc: 'https://evm.shibuya.astar.network',
        evmId: '81',
        token: 'SBY',
    },
    rocstar: {
        name: 'rocstar',
        endpoints: ['wss://rocstar.astar.network'],
        evmRpc: 'https://evm.rocstar.astar.network',
        evmId: '692',
        token: 'SBY',
    },
    development: {
        name: 'development',
        endpoints: ['ws://localhost:9944'],
        evmRpc: '',
        evmId: '',
        token: '',
    },
};
