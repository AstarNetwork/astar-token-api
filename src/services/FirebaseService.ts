import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { inject, injectable } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { ContainerTypes } from '../containertypes';
import { Guard } from '../guard';
import { DappItem, FileInfo, NewDappItem } from '../models/Dapp';
import { NetworkType } from '../networks';

export interface IFirebaseService {
    getDapps(network: NetworkType): Promise<DappItem[]>;
    getDapp(address: string, network: NetworkType): Promise<NewDappItem | undefined>;
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

    public async getDapp(address: string, network: NetworkType): Promise<NewDappItem | undefined> {
        Guard.ThrowIfUndefined('address', address);

        this.initApp();
        const collectionKey = await this.getCollectionKey(network);
        const query = admin.firestore().collection(collectionKey).doc(address);
        const data = await query.get();

        if (data.exists) {
            const dapp = data.data() as NewDappItem;
            const icon = await this.getFileInfo(dapp.iconUrl, collectionKey);
            if (icon) {
                dapp.iconFile = icon;
            }

            const images = await Promise.all(dapp.imagesUrl.map((x) => this.getFileInfo(x, collectionKey)));
            dapp.images = images.filter((x) => x !== null) as FileInfo[];

            return dapp;
        } else {
            return undefined;
        }
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
            address: dapp.address,
            url: dapp.url,
            imagesUrl: dapp.imagesUrl,
            developers: dapp.developers,
            description: dapp.description,
            communities: dapp.communities,
            platforms: dapp.platforms,
            contractType: dapp.contractType,
            mainCategory: dapp.mainCategory,
            license: dapp.license,
        } as DappItem;
        await admin.firestore().collection(collectionKey).doc(dapp.address).set(firebasePayload);

        return firebasePayload;
    }

    private async uploadImage(fileInfo: FileInfo, collectionKey: string, contractAddress: string): Promise<string> {
        const file = admin
            .storage()
            .bucket(functions.config().extfirebase.bucket)
            .file(`${collectionKey}/${contractAddress}_${fileInfo.name}`);
        const buffer = Buffer.from(this.decode(fileInfo.base64content), 'base64');
        await file.save(buffer, { contentType: this.decode(fileInfo.contentType) });
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

    private async getFileInfo(url: string, collectionKey: string): Promise<FileInfo | null> {
        const fileName = decodeURI(url).split('%2F').at(-1)?.split('?')[0];

        try {
            const file = admin
                .storage()
                .bucket(functions.config().extfirebase.bucket)
                .file(`${collectionKey}/${fileName}`);

            const meta = await file.getMetadata();
            const content = await file.download();
            const base64 = content[0].toString('base64');
            const contentType = meta[0].contentType;
            return {
                name: fileName ?? '',
                contentType: this.decode(contentType),
                base64content: this.decode(base64),
            };
        } catch {
            return null;
        }
    }

    /**
     * Firebase encodes '/' as &#x2F; before storing to the db, becasue '/' is special caracter,
     * so we need to fix this before sending to a client.
     * @param data Data to be decoded.
     */
    private decode(data: string): string {
        return data.split('&#x2F;').join('/');
    }
}
