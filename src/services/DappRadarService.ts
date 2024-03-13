import { inject, injectable } from 'inversify';
import axios, { AxiosRequestConfig } from 'axios';
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
    getAggregatedData(network: NetworkType, period: string): Promise<AggregatedMetrics[]>;
}

interface ApiResponse<T> {
    success: boolean;
    results: T[];
    pageCount: number;
}

interface AggregatedMetrics {
    dappId: number;
    name: string;
    url: string;
    metrics: {
        transactions: number;
        transactionsPercentageChange: number;
        uaw: number;
        uawPercentageChange: number;
        volume: number;
        volumePercentageChange: number;
        balance: number;
        balancePercentageChange: number;
    };
}

enum DappRadarMetricType {
    Transactions = 'transactions',
    UniqueActiveWallets = 'uaw',
    Volume = 'volume',
}

@injectable()
export class DappRadarService {
    public static BaseUrl = 'https://apis.dappradar.com/v2/';
    readonly RESULTS_PER_PAGE = 50;

    constructor(@inject(ContainerTypes.FirebaseService) private firebase: IFirebaseService) {}

    public async getDapps(network: NetworkType): Promise<Dapp[]> {
        Guard.ThrowIfUndefined('network', network);
        this.ThrowIfNetworkNotSupported(network);

        const result: Dapp[] = [];
        let currentPage = 1;

        // Dapps request is paged so we need to fetch all pages.
        do {
            const url = `${
                DappRadarService.BaseUrl
            }/dapps?chain=${network.toLowerCase()}&page=${currentPage}&resultsPerPage=${this.RESULTS_PER_PAGE}`;

            try {
                const response = await axios.get<ApiResponse<Dapp>>(url, this.getOptions());

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
        this.ThrowIfNetworkNotSupported(network);

        const dappId = await this.getDappId(dappName, dappUrl, network);
        return await this.getMetricHistory(dappId, network, DappRadarMetricType.Transactions);
    }

    public async getDappUawHistory(dappName: string, dappUrl: string, network: NetworkType): Promise<Metric[]> {
        Guard.ThrowIfUndefined('dappName', dappName);
        Guard.ThrowIfUndefined('dappUrl', dappUrl);
        Guard.ThrowIfUndefined('network', network);
        this.ThrowIfNetworkNotSupported(network);

        const dappId = await this.getDappId(dappName, dappUrl, network);
        return await this.getMetricHistory(dappId, network, DappRadarMetricType.UniqueActiveWallets);
    }

    public async getAggregatedData(network: NetworkType, period: string): Promise<AggregatedMetrics[]> {
        Guard.ThrowIfUndefined('network', network);
        Guard.ThrowIfUndefined('period', period);
        this.ThrowIfNetworkNotSupported(network);

        const result: AggregatedMetrics[] = [];
        let currentPage = 1;

        do {
            try {
                const url = `${
                    DappRadarService.BaseUrl
                }/dapps/aggregated/metrics?chain=${network.toLowerCase()}&range=${period}&resultsPerPage=${
                    this.RESULTS_PER_PAGE
                }&page=${currentPage}`;
                const response = await axios.get<ApiResponse<AggregatedMetrics>>(url, this.getOptions());

                if (response.data.success) {
                    // Add url to result.
                    const cachedDapps = await this.getDappsFromCache(network);
                    result.push(
                        ...response.data.results.map((result) => {
                            return {
                                ...result,
                                url: cachedDapps.find((dapp) => dapp.dappId === result.dappId)?.website ?? '',
                            };
                        }),
                    );
                }

                if (currentPage === response.data.pageCount) {
                    break;
                }

                currentPage++;
            } catch {
                break;
            }
        } while (true);

        return result;
    }

    private async getMetricHistory(
        dappId: number | undefined,
        network: NetworkType,
        metric: DappRadarMetricType,
    ): Promise<Metric[]> {
        const result: Metric[] = [];

        if (dappId) {
            const url = `${DappRadarService.BaseUrl}/dapps/${dappId}/history/${metric}?chain=${network.toLowerCase()}`;
            const response = await axios.get<ApiResponse<Metric>>(url, this.getOptions());

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
            (x) =>
                x.name.toLowerCase() === dappName.toLowerCase() ||
                this.getDomain(x.website.toLowerCase()) === this.getDomain(dappUrl.toLowerCase()),
        )?.dappId;
    }

    private getDomain(url: string): string | null {
        const prefix = /^https?:\/\//i;
        const domain = /^[^\/:]+/;
        // Remove any prefix
        url = url.replace(prefix, '');
        // Extract just the domain
        const match = url.match(domain);
        if (match) {
            return match[0];
        }

        return null;
    }

    private getCacheKey(network: NetworkType): string {
        return `${network}_dapps`;
    }

    private ThrowIfNetworkNotSupported(network: NetworkType): void {
        if (network !== 'astar' && network !== 'shiden') {
            throw new Error(`Network ${network} is not supported.`);
        }
    }

    public getOptions(): AxiosRequestConfig {
        // dappradar.apikey is deprecated, use dappradar.apikey2 instead.
        const apiKey = this.firebase.getEnvVariable('dappradar', 'apikey2');
        const options: AxiosRequestConfig = {};
        if (apiKey) {
            options.headers = { 'x-api-key': apiKey };
        }

        return options;
    }
}
