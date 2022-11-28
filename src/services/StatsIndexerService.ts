import axios from 'axios';
import { ethers } from 'ethers';
import { inject, injectable } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { ContainerTypes } from '../containertypes';
import { NetworkType } from '../networks';
import { getDateUTC, getDateYyyyMmDd, getSubscanUrl, getSubscanOption } from '../utils';
import { Pair, PeriodType, ServiceBase } from './ServiceBase';

export interface IStatsIndexerService {
    getDappStakingTvl(network: NetworkType, period: PeriodType): Promise<Pair[]>;

    getValidTransactions(network: NetworkType, period: PeriodType): Promise<Pair[]>;

    getTotalTransfers(network: NetworkType): Promise<number>;

    getPrice(network: NetworkType, period: PeriodType): Promise<Pair[]>;

    getTvl(network: NetworkType, period: PeriodType): Promise<Pair[]>;

    getHolders(network: NetworkType): Promise<number>;
}

const API_URLS_TVL = {
    astar: 'https://api.subquery.network/sq/bobo-k2/astar-tvl__Ym9ib',
    shiden: 'https://api.subquery.network/sq/bobo-k2/shiden-statistics-v2',
};

@injectable()
/**
 * Fetches statistics from external data source
 */
export class StatsIndexerService extends ServiceBase implements IStatsIndexerService {
    constructor(@inject(ContainerTypes.ApiFactory) private _apiFactory: IApiFactory) {
        super();
    }

    public async getDappStakingTvl(network: NetworkType, period: PeriodType): Promise<Pair[]> {
        if (network !== 'astar' && network !== 'shiden') {
            return [];
        }

        const range = this.getDateRange(period);

        try {
            const result = await axios.post(API_URLS_TVL[network], {
                query: `query {
              tvls(filter: {
                timestamp: {
                  greaterThanOrEqualTo: "${range.start.getTime()}"
                },
                and: {
                  timestamp: {
                    lessThanOrEqualTo: "${range.end.getTime()}"
                  }
                }
              }, orderBy: TIMESTAMP_ASC) {
                nodes {
                  timestamp,
                  tvlUsd
                }
              }
            }`,
            });

            const indexedTvl = result.data.data.tvls.nodes.map((node: { timestamp: string; tvlUsd: number }) => {
                return [node.timestamp, node.tvlUsd];
            });

            // Add current TVL to the result, so we provide up to date TVL info.
            try {
                indexedTvl.push(await this.getCurrentTvlInUsd(network));
            } catch (err) {
                console.error(`Unable to fetch current TVL ${err}`);
            }

            return indexedTvl;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getValidTransactions(network: NetworkType, period: PeriodType): Promise<Pair[]> {
        // Docs: https://support.subscan.io/#daily
        const base = getSubscanUrl(network);
        const url = base + '/api/scan/daily';
        const range = this.getDateRange(period);
        const option = getSubscanOption();

        try {
            const result = await axios.post(
                url,
                {
                    start: getDateYyyyMmDd(range.start),
                    end: getDateYyyyMmDd(range.end),
                    format: 'day',
                    category: 'transfer',
                },
                option,
            );

            return result.data.data.list.map((node: { time_utc: string; total: number }) => {
                return [Date.parse(node.time_utc), node.total];
            });
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getTotalTransfers(network: NetworkType): Promise<number> {
        // Docs: https://support.subscan.io/#transfers
        const base = getSubscanUrl(network);
        const url = base + '/api/scan/transfers';
        const option = getSubscanOption();

        try {
            const result = await axios.post(
                url,
                {
                    row: 1,
                    page: 1,
                },
                option,
            );
            return result.data.data.count;
        } catch (e) {
            console.error(e);
            throw new Error(
                'Unable to fetch number of total transfers. Most likely there is an error fetching data from Subscan API.',
            );
        }
    }

    public async getPrice(network: NetworkType = 'astar', period: PeriodType): Promise<Pair[]> {
        const numberOfDays = this.getPeriodDurationInDays(period);

        try {
            const interval = period === '1 year' ? 'daily' : 'hourly';
            const result = await axios.get(
                `https://api.coingecko.com/api/v3/coins/${network}/market_chart?vs_currency=usd&days=${numberOfDays}&interval=${interval}`,
            );
            return result.data.prices;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getTvl(network: NetworkType = 'astar', period: PeriodType): Promise<Pair[]> {
        if (network === 'astar') {
            return this.getTvlAstar(period);
        }

        const numberOfDays = this.getPeriodDurationInDays(period);

        try {
            const result = await axios.get(`https://api.llama.fi/charts/${network}`);
            return result.data.slice(-numberOfDays).map((item: { date: string; totalLiquidityUSD: number }) => {
                return [Number(item.date), item.totalLiquidityUSD];
            });
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    private async getTvlAstar(period: PeriodType): Promise<Pair[]> {
        const numberOfDays = this.getPeriodDurationInDays(period);

        try {
            const [result, resultBorrows] = await Promise.all([
                axios.get('https://api.llama.fi/charts/astar'),
                axios.get('https://api.llama.fi/protocol/starlay-finance'),
            ]);
            const tvl = result.data.slice(-numberOfDays).map((item: { date: string; totalLiquidityUSD: number }) => {
                return [Number(item.date), item.totalLiquidityUSD];
            });
            const borrows = resultBorrows.data.chainTvls['Astar-borrowed'].tvl.map(
                (item: { date: string; totalLiquidityUSD: number }) => {
                    return [Number(item.date), item.totalLiquidityUSD];
                },
            );

            // fix: last borrow date is not for day start while tvl is, so we match them anyway since last values are for the current day.
            if (borrows && borrows.length > 0 && tvl && tvl.length > 0) {
                const lastBorrow = borrows[borrows.length - 1];
                const lastTvl = tvl[tvl.length - 1];
                lastBorrow[0] = lastTvl[0];
            }

            // match tvl and borrow by date and increase tvl by borrow ammount
            // todo optimize
            for (let i = 0; i < tvl.length; i++) {
                for (let j = 0; j < borrows.length; j++) {
                    if (tvl[i][0] === borrows[j][0]) {
                        tvl[i][1] += borrows[j][1];
                    }
                }
            }

            return tvl;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    private async getCurrentTvlInUsd(network: NetworkType = 'astar'): Promise<[number, number]> {
        // Current TVL
        const api = this._apiFactory.getApiInstance(network);
        const [tvl, priceResult] = await Promise.all([
            api.getTvl(),
            await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${network}&vs_currencies=usd`),
        ]);

        const decimals = await api.getChainDecimals();
        const totalStaked = Number(ethers.utils.formatUnits(tvl.toString(), decimals));
        const price = priceResult.data[network].usd;
        const utcNow = getDateUTC(new Date());

        return [utcNow.getTime(), totalStaked * price];
    }

    public async getHolders(network = 'astar'): Promise<number> {
        try {
            const base = getSubscanUrl(network);
            const url = base + '/api/scan/metadata';
            const option = getSubscanOption();
            const body = {};
            const result = await axios.post(url, body, option);

            if (result.data) {
                const holders = result.data.data.count_account;
                return Number(holders);
            } else {
                return 0;
            }
        } catch (e) {
            console.error(e);
            throw new Error('Something went wrong. Most likely there is an error fetching data from Subscan API.');
        }
    }
}
