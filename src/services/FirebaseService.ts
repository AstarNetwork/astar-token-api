import { notEqual } from 'assert';
import admin from 'firebase-admin';
import { inject, injectable } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { DappItem } from '../models/Dapp';
import { NetworkType } from '../networks';

export interface IFirebaseService {
    getDapps(network: NetworkType): Promise<DappItem[]>;
}

@injectable()
export class FirebaseService implements IFirebaseService {
    private app: admin.app.App;

    constructor(@inject('factory') private _apiFactory: IApiFactory) {}

    public async getDapps(network: NetworkType = 'astar'): Promise<DappItem[]> {
        this.initApp();

        const collectionKey = await this.getCollectionKey(network);
        const query = admin.firestore().collection(collectionKey);
        const data = await query.orderBy('name').get();

        const result: DappItem[] = [];
        data.forEach((x) => {
            const data = x.data() as DappItem;
            result.push(data);
        });

        return result;
    }

    private initApp(): void {
        if (!this.app) {
            this.app = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/gm, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                }),
            });
        }
    }

    private async getCollectionKey(network: NetworkType): Promise<string> {
        if (network.toString() === 'development') {
            // special case so we can test dapps staking on a local node.
            return 'development-dapps';
        }

        const api = this._apiFactory.getApiInstance(network);
        const chain = await api.getChainName();
        const collectionKey = `${chain.toString().toLowerCase()}-dapps`.replace(' ', '-');

        return collectionKey;
    }
}
