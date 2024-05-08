export type NetworkType = 'astar' | 'shiden' | 'shibuya' | 'rocstar' | 'development' | 'astar-zkevm' | 'zkyoto';

export const networks = {
    astar: {
        name: 'astar',
        endpoints: [
            'wss://rpc.astar.network',
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
        endpoints: ['ws://127.0.0.1:9944'],
        evmRpc: '',
        evmId: '',
        token: '',
    },
    ['astar-zkevm']: {
        name: 'astar-zkevm',
        endpoints: [''],
        evmRpc: 'https://rpc.startale.com/astar-zkevm',
        evmId: '3776',
        token: 'ETH',
    },
    zkyoto: {
        name: 'zkyoto',
        endpoints: [''],
        evmRpc: 'https://rpc.startale.com/zkyoto',
        evmId: '6038361',
        token: 'ETH',
    },
};
