import { NetworkType } from '../../src/networks';
import { ISubscanService } from '../../src/services/SubscanService';
import { transferExtrinsicData } from '../mock/TxQueryService';

export class SubscanServiceMock implements ISubscanService {
    public async fetchSubscan({ network, hash, type }: { network: NetworkType; hash: string; type: string }) {
        let mockedData;
        if (type === 'transfer') {
            mockedData = transferExtrinsicData;
        }
        return Promise.resolve(mockedData.data);
    }
}
