import { inject, injectable } from 'inversify';
import axios from 'axios';
import * as functions from 'firebase-functions';
import { Dapp, Metric } from '../models/DappRadar';
import { NetworkType } from '../networks';
import { Guard } from '../guard';
import { IFirebaseService } from './FirebaseService';
import { ContainerTypes } from '../containertypes';

export interface IDappRadarService {
    getDapps(network: NetworkType): Promise<Dapp[]>;
    getDappTransactionsHistory(dappName: string, dappUrl: string, network: NetworkType): Promise<Metric[]>;
    getDappUawHistory(dappName: string, dappUrl: string, network: NetworkType): Promise<Metric[]>;
}

interface GetDappsResponse {
    success: boolean;
    results: Dapp[];
}

interface DappMetricResponse {
    success: boolean;
    results: Metric[];
}

enum DappRadarMetricType {
    Transactions = 'transactions',
    UniqueActiveWallets = 'uaw',
    Volume = 'volume',
}

@injectable()
export class DappRadarService {
    public static BaseUrl = 'https://api.dappradar.com/xwdze7hui0y5gixt/';

    constructor(@inject(ContainerTypes.FirebaseService) private firebase: IFirebaseService) {}

    public async getDapps(network: NetworkType): Promise<Dapp[]> {
        const result: Dapp[] = [];
        let currentPage = 1;
        const RESULTS_PER_PAGE = 50;

        // Dapps request is paged so we need to fetch all pages.
        do {
            const url = `${
                DappRadarService.BaseUrl
            }/dapps?chain=${network.toLowerCase()}&page=${currentPage}&resultsPerPage=${RESULTS_PER_PAGE}`;

            try {
                const response = await axios.get<GetDappsResponse>(url, {
                    headers: { 'X-BLOBR-KEY': `${functions.config().dappradar.apikey}` },
                });

                if (response.status !== 200 && !response.data.success) {
                    break;
                }

                result.push(...response.data.results);
                currentPage++;
            } catch {
                // If requested page is not found api returns 404
                break;
            }
        } while (true);

        return result;
    }

    private async getDappsFromCache(network: NetworkType): Promise<Dapp[]> {
        let dapps: Dapp[] = [];
        const key = this.getCacheKey(network);
        const cacheValidityTime = 24 * 60 * 60; // 1 day in seconds
        let secondsAgo = 0;

        const cache = await this.firebase.readCache<Dapp[]>(key);

        // Calculate time passed after last cache update.
        if (cache && cache.updatedAt) {
            secondsAgo = (new Date().getTime() - cache.updatedAt) / 1000;
        }

        // In case there is no cache, cache validity expired or cache is empty
        // fetch data from Dapp Radar.
        if (!cache || secondsAgo > cacheValidityTime || !cache.data.length) {
            // Update cache with latest dapps.
            dapps = await this.getDapps(network);
            await this.storeDappsToCache(network, dapps);
        } else {
            dapps = cache.data;
        }

        return dapps;
    }

    private async storeDappsToCache(network: NetworkType, dapps: Dapp[]): Promise<void> {
        const key = this.getCacheKey(network);
        await this.firebase.updateCache<Dapp[]>(key, dapps);
    }

    public async getDappTransactionsHistory(
        dappName: string,
        dappUrl: string,
        network: NetworkType,
    ): Promise<Metric[]> {
        Guard.ThrowIfUndefined('dappName', dappName);
        Guard.ThrowIfUndefined('dappUrl', dappUrl);
        Guard.ThrowIfUndefined('network', network);

        const dappId = await this.getDappId(dappName, dappUrl, network);
        return await this.getMetricHistory(dappId, network, DappRadarMetricType.Transactions);
    }

    public async getDappUawHistory(dappName: string, dappUrl: string, network: NetworkType): Promise<Metric[]> {
        Guard.ThrowIfUndefined('dappName', dappName);
        Guard.ThrowIfUndefined('dappUrl', dappUrl);
        Guard.ThrowIfUndefined('network', network);

        const dappId = await this.getDappId(dappName, dappUrl, network);
        return await this.getMetricHistory(dappId, network, DappRadarMetricType.UniqueActiveWallets);
    }

    private async getMetricHistory(
        dappId: number | undefined,
        network: NetworkType,
        metric: DappRadarMetricType,
    ): Promise<Metric[]> {
        const result: Metric[] = [];

        if (dappId) {
            const url = `${DappRadarService.BaseUrl}/dapps/${dappId}/history/${metric}?chain=${network.toLowerCase()}`;
            const response = await axios.get<DappMetricResponse>(url, {
                headers: { 'X-BLOBR-KEY': `${functions.config().dappradar.apikey}` },
            });

            if (response.data.success) {
                result.push(...response.data.results);
            }
        }

        return result;
    }

    private async getDappId(dappName: string, dappUrl: string, network: NetworkType): Promise<number | undefined> {
        const dapps = await this.getDappsFromCache(network);

        // In some cases dapp name in dapp staking and in dapp radar are not exactly the same, so idea to check if
        // name or dapp url match. If both are different most likely the dapp will need to update name or url in dapp staking.
        return dapps.find(
            (x) => x.name.toLowerCase() === dappName.toLowerCase() || x.website.toLowerCase() === dappUrl.toLowerCase(),
        )?.dappId;
    }

    private getCacheKey(network: NetworkType): string {
        return `${network}_dapps`;
    }
}
