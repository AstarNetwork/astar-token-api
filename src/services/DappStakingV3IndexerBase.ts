import { Guard } from '../guard';
import { NetworkType } from '../networks';
import { ServiceBase } from './ServiceBase';

export class DappStakingV3IndexerBase extends ServiceBase {
    protected GuardNetwork(network: NetworkType) {
        Guard.ThrowIfUndefined('network', network);
        if (!['shibuya', 'shiden', 'astar'].includes(network)) {
            throw new Error(`This method is not supported for the network ${network}`);
        }
    }

    protected getApiUrl(network: NetworkType): string {
        // For local development: `http://localhost:4350/graphql`;
        return `https://astar-network.squids.live/dapps-staking-indexer-${network}/v/v14/graphql`;
    }
}
