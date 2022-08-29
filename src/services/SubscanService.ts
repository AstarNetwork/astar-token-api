import axios from 'axios';
import { injectable } from 'inversify';
import { NetworkType } from '../networks';
import { getSubscanOption, getSubscanUrl } from '../utils';

/**
 * Provides data by Subscan API
 */
export interface ISubscanService {
    fetchSubscan({ network, hash, type }: { network: NetworkType; hash: string; type: string }): Promise<any>;
}

@injectable()
export class SubscanService implements ISubscanService {
    public async fetchSubscan({ network, hash, type }: { network: NetworkType; hash: string; type: string }) {
        const base = getSubscanUrl(network);
        const option = getSubscanOption();
        const url = base + '/api/scan/extrinsic';
        const { data } = await axios.post(
            url,
            {
                hash,
            },
            option,
        );
        return data.data;
    }
}
