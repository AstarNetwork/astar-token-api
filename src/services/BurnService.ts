import { injectable } from 'inversify';
import { NetworkType } from '../networks';
import axios from 'axios';
import { DappStakingV3IndexerBase } from './DappStakingV3IndexerBase';

export type BurnEvent = {
    blockNumber: number;
    timestamp: number;
    amount: bigint;
    user: string;
};

export interface IBurnService {
    getBurnEvents(network: NetworkType): Promise<BurnEvent[]>;
}

@injectable()
export class BurnService extends DappStakingV3IndexerBase implements IBurnService {
    public async getBurnEvents(network: NetworkType): Promise<BurnEvent[]> {
        this.GuardNetwork(network);

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query {
                  burns(orderBy: id_ASC) {
                  blockNumber
                  timestamp
                  user
                  amount
                }
              }`,
            });

            return result.data.data.burns;
        } catch (e) {
            console.error(e);
            return [];
        }
    }
}
