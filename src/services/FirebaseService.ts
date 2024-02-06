import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { inject, injectable } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { ContainerTypes } from '../containertypes';
import { Guard } from '../guard';
import { DappItem, FileInfo, NewDappItem } from '../models/Dapp';
import { NetworkType } from '../networks';
import { CollectionReference, DocumentData, Query } from 'firebase-admin/firestore';

export interface Cache<T> {
    updatedAt?: number;
    data: T;
}

export interface IFirebaseService {
    getDappsFull(network: NetworkType): Promise<DappItem[]>;
    getDapps(network: NetworkType): Promise<DappItem[]>;
    getDapp(address: string, network: NetworkType, forEdit: boolean): Promise<NewDappItem | undefined>;
    registerDapp(dapp: NewDappItem, network: NetworkType): Promise<DappItem>;
    updateCache<T>(key: string, item: T): Promise<void>;
    readCache<T>(key: string): Promise<Cache<T> | undefined>;
    getEnvVariable(keyPart1: string, keyPart2: string): string;
}

@injectable()
export class FirebaseService implements IFirebaseService {
    private app: admin.app.App;
    private readonly cacheCollectionKey = 'CACHE';

    constructor(@inject(ContainerTypes.ApiFactory) private _apiFactory: IApiFactory) {}

    public async getDappsFull(network: NetworkType = 'astar'): Promise<DappItem[]> {
        this.initApp();

        const collectionKey = await this.getCollectionKey(network);
        const query = admin.firestore().collection(collectionKey);

        return await this.getDappsData(query);
    }

    public async getDapps(network: NetworkType = 'astar'): Promise<DappItem[]> {
        this.initApp();

        const collectionKey = await this.getCollectionKey(network);
        const query = admin
            .firestore()
            .collection(collectionKey)
            .select('name', 'iconUrl', 'address', 'mainCategory', 'imagesUrl', 'shortDescription');

        return this.getDappsData(query);
    }

    public async getDapp(address: string, network: NetworkType, forEdit = false): Promise<NewDappItem | undefined> {
        Guard.ThrowIfUndefined('address', address);

        this.initApp();
        const collectionKey = await this.getCollectionKey(network);
        // Fetch all addresses because Firebase search is case sensitive.
        const query = admin.firestore().collection(collectionKey).select('address');
        const data = await query.get();

        const fbAddressData = data.docs.find((x) => x.data().address.toUpperCase() === address.toUpperCase());
        if (fbAddressData) {
            const fbAddress = fbAddressData.data().address;
            const dapp = (
                await admin.firestore().collection(collectionKey).doc(fbAddress).get()
            ).data() as unknown as NewDappItem;

            if (forEdit) {
                const icon = await this.getFileInfo(dapp.iconUrl, collectionKey);
                if (icon) {
                    dapp.iconFile = icon;
                }

                const images = dapp.imagesUrl
                    ? await Promise.all(dapp.imagesUrl.map((x) => this.getFileInfo(x, collectionKey)))
                    : [];
                dapp.images = images.filter((x) => x !== null) as FileInfo[];
            }

            return dapp;
        }

        return undefined;
    }

    public async registerDapp(dapp: NewDappItem, network: NetworkType): Promise<DappItem> {
        this.initApp();
        const collectionKey = await this.getCollectionKey(network);

        // upload icon file
        if (dapp.iconFile) {
            dapp.iconUrl = await this.uploadImage(dapp.iconFile, collectionKey, dapp.address);
        }

        // upload images
        dapp.imagesUrl = [];
        for (const image of dapp.images) {
            if (image) {
                const imageUrl = await this.uploadImage(image, collectionKey, dapp.address);
                dapp.imagesUrl.push(imageUrl);
            }
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
            shortDescription: dapp.shortDescription ?? '',
            communities: dapp.communities,
            contractType: dapp.contractType,
            mainCategory: dapp.mainCategory,
            license: dapp.license ?? '',
            tags: dapp.tags,
        } as DappItem;
        await admin.firestore().collection(collectionKey).doc(dapp.address).set(firebasePayload);

        return firebasePayload;
    }

    public async updateCache<T>(key: string, item: T): Promise<void> {
        Guard.ThrowIfUndefined('key', key);
        Guard.ThrowIfUndefined('item', item);

        this.initApp();
        const updatedAt = new Date().getTime();
        await admin.firestore().collection(this.cacheCollectionKey).doc(key).set({ data: item, updatedAt });
    }

    public async readCache<T>(key: string): Promise<Cache<T> | undefined> {
        Guard.ThrowIfUndefined('key', key);

        this.initApp();
        const data = await admin.firestore().collection(this.cacheCollectionKey).doc(key).get();
        const doc = data.data();

        if (doc) {
            return {
                data: doc.data as T,
                updatedAt: data.updateTime?.toMillis(),
            };
        } else {
            return undefined;
        }
    }

    public getEnvVariable(keyPart1: string, keyPart2: string): string {
        Guard.ThrowIfUndefined('keyPart1', keyPart1);
        Guard.ThrowIfUndefined('keyPart2', keyPart2);

        return String(functions.config()[keyPart1][keyPart2]);
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
        } else if (network.toString().includes('testnet')) {
            // another special case when testing with Zombienet
            return network.toString().replace(' ', '-').toLowerCase();
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

    private async getDappsData(query: CollectionReference<DocumentData> | Query<DocumentData>): Promise<DappItem[]> {
        const data = await query.orderBy('name').get();

        const result: DappItem[] = [];
        data.forEach((x) => {
            const data = x.data() as DappItem;
            data.creationTime = x.createTime.seconds;
            result.push(data);
        });

        return result;
    }
}
