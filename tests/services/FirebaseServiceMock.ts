import { DappItem, NewDappItem } from '../../src/models/Dapp';
import { NetworkType } from '../../src/networks';
import { Cache, IFirebaseService } from '../../src/services/FirebaseService';

export class FirebaseServiceMock implements IFirebaseService {
    public async getDapps(network: NetworkType): Promise<DappItem[]> {
        return [];
    }

    public async getDappsFull(network: NetworkType): Promise<DappItem[]> {
        return [];
    }

    public async registerDapp(dapp: NewDappItem, network: NetworkType): Promise<DappItem> {
        throw new Error('Method not implemented.');
    }

    public async getDapp(address: string, network: NetworkType, forEdit = false): Promise<NewDappItem | undefined> {
        throw new Error('Method not implemented.');
    }

    public async updateCache<T>(key: string, item: T): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async readCache<T>(key: string): Promise<Cache<T> | undefined> {
        throw new Error('Method not implemented.');
    }

    public getEnvVariable(keyPart1: string, keyPart2: string): string {
        return '';
    }
}
