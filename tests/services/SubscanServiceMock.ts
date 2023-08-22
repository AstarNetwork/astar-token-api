// TODO remove use of any
/* eslint-disable  @typescript-eslint/no-explicit-any */
import { NetworkType } from '../../src/networks';
import { ISubscanService, QueryPath } from '../../src/services/SubscanService';
import { transferExtrinsicData, transferExtrinsicsData } from '../mock/TxQueryService';

export class SubscanServiceMock implements ISubscanService {
    public async fetchSubscan({ network, body, queryPath }: { network: NetworkType; body: any; queryPath: QueryPath }) {
        let mockedData;
        if (queryPath === 'extrinsic') {
            mockedData = transferExtrinsicData;
        } else if (queryPath === 'extrinsics') {
            mockedData = transferExtrinsicsData;
        }
        return Promise.resolve(mockedData.data);
    }
}
