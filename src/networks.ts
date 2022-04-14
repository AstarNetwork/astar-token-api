export type NetworkType = 'astar' | 'shiden' | 'shibuya';

export const networks = {
    astar: {
        name: 'astar',
        endpoint: 'wss://rpc.astar.network',
    },
    shiden: {
        name: 'shiden',
        endpoint: 'wss://rpc.shiden.astar.network',
    },
    shibuya: {
        name: 'shibuya',
        endpoint: 'wss://rpc.shibuya.astar.network',
    },
};
