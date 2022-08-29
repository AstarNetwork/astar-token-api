import { AxiosRequestConfig } from 'axios';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { inject, injectable } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { ContainerTypes } from '../containertypes';
import { DappItem, FileInfo, NewDappItem } from '../models/Dapp';
import { NetworkType } from '../networks';

export interface IFirebaseService {
    getDapps(network: NetworkType): Promise<DappItem[]>;
    registerDapp(dapp: NewDappItem, network: NetworkType): Promise<DappItem>;
}

@injectable()
export class FirebaseService implements IFirebaseService {
    private app: admin.app.App;

    constructor(@inject(ContainerTypes.ApiFactory) private _apiFactory: IApiFactory) {}

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

    public async registerDapp(dapp: NewDappItem, network: NetworkType): Promise<DappItem> {
        this.initApp();
        const collectionKey = await this.getCollectionKey(network);

        // upload icon file
        const iconUrl = await this.uploadImage(dapp.iconFile, collectionKey, dapp.address);
        dapp.iconUrl = iconUrl;

        // upload images
        dapp.imagesUrl = [];
        for (const image of dapp.images) {
            const imageUrl = await this.uploadImage(image, collectionKey, dapp.address);
            dapp.imagesUrl.push(imageUrl);
        }

        //upload document
        const firebasePayload = {
            name: dapp.name,
            iconUrl: dapp.iconUrl,
            description: dapp.description,
            url: dapp.url,
            address: dapp.address,
            license: dapp.license,
            videoUrl: dapp.videoUrl ? dapp.videoUrl : '',
            tags: dapp.tags,
            forumUrl: dapp.forumUrl,
            authorContact: dapp.authorContact,
            gitHubUrl: dapp.gitHubUrl,
            imagesUrl: dapp.imagesUrl,
        } as DappItem;
        await admin.firestore().collection(collectionKey).doc(dapp.address).set(firebasePayload);

        return firebasePayload;
    }

    private async uploadImage(fileInfo: FileInfo, collectionKey: string, contractAddress: string): Promise<string> {
        const file = admin
            .storage()
            .bucket(functions.config().extfirebase.bucket)
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
                    projectId: functions.config().extfirebase.projectid,
                    privateKey: functions.config().extfirebase.privatekey?.replace(/\\n/gm, '\n'),
                    clientEmail: functions.config().extfirebase.clientemail,
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
