import { DappItem, NewDappItem } from '../../src/models/Dapp';
import { NetworkType } from '../../src/networks';
import { IFirebaseService } from '../../src/services/FirebaseService';

export class FirebaseServiceMock implements IFirebaseService {
    public async getDapps(network: NetworkType): Promise<DappItem[]> {
        return [];
    }

    public async registerDapp(dapp: NewDappItem, network: NetworkType): Promise<DappItem> {
        throw new Error('Method not implemented.');
    }

    public async getDapp(address: string, network: NetworkType): Promise<NewDappItem | undefined> {
        throw new Error('Method not implemented.');
    }
}
