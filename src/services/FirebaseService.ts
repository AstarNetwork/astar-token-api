import admin from 'firebase-admin';
import { inject, injectable } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { DappItem, FileInfo, NewDappItem } from '../models/Dapp';
import { NetworkType } from '../networks';

export interface IFirebaseService {
    getDapps(network: NetworkType): Promise<DappItem[]>;
    registerDapp(dapp: NewDappItem, network: NetworkType): Promise<void>;
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

    public async registerDapp(dapp: NewDappItem, network: NetworkType): Promise<void> {
        this.initApp();

        // TODO validate dapp
        const collectionKey = await this.getCollectionKey(network);

        // upload icon file
        const iconUrl = await this.uploadImage(dapp.iconFile, collectionKey, dapp.address);
        dapp.iconUrl = iconUrl;

        // upload images
        dapp.imagesUrl = [];
        dapp.images.forEach(async (image) => {
            const imageUrl = await this.uploadImage(image, collectionKey, dapp.senderAddress);
            dapp.imagesUrl.push(imageUrl);
        });

        //upload document
        await admin.firestore().collection(collectionKey).doc(dapp.address).set(dapp);
    }

    private async uploadImage(fileInfo: FileInfo, collectionKey: string, contractAddress: string): Promise<string> {
        const file = admin
            .storage()
            .bucket(process.env.FIREBASE_BUCKET_NAME)
            .file(`${collectionKey}/${contractAddress}_${fileInfo.name}`);
        const buffer = Buffer.from(fileInfo.base64content, 'base64');
        await file.save(buffer, { contentType: fileInfo.contentType });
        file.makePublic();

        return file.publicUrl();
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
