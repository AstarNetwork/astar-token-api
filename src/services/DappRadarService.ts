import { injectable } from 'inversify';
import axios from 'axios';
import * as functions from 'firebase-functions';
import fs from 'fs';
import { Dapp, Metric } from '../models/DappRadar';
import { NetworkType } from '../networks';
import { Guard } from '../guard';

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
    public static BaseUrl = 'https://api.dappradar.com/nd3xlju1tifxcin7';

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
        const fileName = this.getFileName(network);
        const cacheValidityTime = 24 * 60 * 60; // 1 day in seconds

        // Find when file was last modified so we can determine if we need to refresh cache or not.
        let secondsAgo = 0;
        let cacheFileExists = false;

        if (fs.existsSync(fileName)) {
            cacheFileExists = true;
            const fileStats = fs.statSync(fileName);
            secondsAgo = (new Date().getTime() - fileStats.mtimeMs) / 1000;
        }

        if (!cacheFileExists || secondsAgo > cacheValidityTime) {
            // If not cached file or cache exired, reload dapps list.
            dapps = await this.getDapps(network);
            if (dapps.length > 0) {
                this.storeDappsToCache(network, dapps);
            }
        } else {
            const file = fs.readFileSync(fileName);
            dapps = JSON.parse(file.toString()) as Dapp[];
        }

        return dapps;
    }

    private storeDappsToCache(network: NetworkType, dapps: Dapp[]): void {
        const fileName = this.getFileName(network);
        fs.writeFileSync(fileName, JSON.stringify(dapps));
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
        // name or dapp url match. If both are different most likely they dapp will need to update name or url in dapp staking.
        return dapps.find(
            (x) => x.name.toLowerCase() === dappName.toLowerCase() || x.website.toLowerCase() === dappUrl.toLowerCase(),
        )?.dappId;
    }

    private getFileName(network: NetworkType): string {
        return `${network}_dapps.json`;
    }
}
