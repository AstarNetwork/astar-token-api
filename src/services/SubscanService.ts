/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { injectable } from 'inversify';
import { NetworkType } from '../networks';
import { getSubscanOption, getSubscanUrl } from '../utils';

export type QueryPath = 'extrinsic' | 'extrinsics';

/**
 * Provides data by Subscan API
 */
export interface ISubscanService {
    fetchSubscan({ network, body, queryPath }: { network: NetworkType; body: any; queryPath: QueryPath }): Promise<any>;
}

@injectable()
export class SubscanService implements ISubscanService {
    public async fetchSubscan({ network, body, queryPath }: { network: NetworkType; body: any; queryPath: QueryPath }) {
        const base = getSubscanUrl(network);
        const option = getSubscanOption();
        const url = base + `/api/scan/${queryPath}`;
        const { data } = await axios.post(url, body, option);
        return data.data;
    }
}
