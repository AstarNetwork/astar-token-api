import axios from 'axios';
import { ethers } from 'ethers';
import { inject, injectable } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { NetworkType } from '../networks';
import { getDateUTC } from '../utils';

export type PeriodType = '7 days' | '30 days' | '90 days' | '1 year';
export type Pair = { date: number; value: number };
export type DateRange = { start: Date; end: Date };

export interface IStatsIndexerService {
    getDappStakingTvl(network: NetworkType, period: PeriodType): Promise<Pair[]>;

    getTransactionsPerBlock(network: NetworkType, period: PeriodType): Promise<Pair[]>;

    getPrice(network: NetworkType, period: PeriodType): Promise<Pair[]>;

    getTvl(network: NetworkType, period: PeriodType): Promise<Pair[]>;
}

const DEFAULT_RANGE_LENGTH_DAYS = 7;
const API_URLS = {
    astar: 'http://localhost:3000',
    shiden: 'https://api.subquery.network/sq/bobo-k2/shiden-statistics',
};

const API_URLS_TVL = {
    astar: 'https://api.subquery.network/sq/bobo-k2/astar-tvl__Ym9ib',
    shiden: 'https://api.subquery.network/sq/bobo-k2/shiden-statistics',
};

@injectable()
/**
 * Fetches statistics from external data source
 */
export class StatsIndexerService implements IStatsIndexerService {
    constructor(@inject('factory') private _apiFactory: IApiFactory) {}

    public async getDappStakingTvl(network: NetworkType, period: PeriodType): Promise<Pair[]> {
        if (network !== 'astar') {
            return [];
        }

        const range = this.getDateRange(period);

        try {
            const result = await axios.post(API_URLS[network], {
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

    public async getTransactionsPerBlock(network: NetworkType, period: PeriodType): Promise<Pair[]> {
        if (network !== 'astar' && network !== 'shiden') {
            return [];
        }

        const range = this.getDateRange(period);

        try {
            const result = await axios.post(API_URLS[network], {
                query: `query {
              transactionsPerBlocks(filter: {
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
                  numberOfTransactions
                }
              }
            }`,
            });

            return result.data.data.transactionsPerBlocks.nodes.map(
                (node: { timestamp: string; numberOfTransactions: number }) => {
                    return [node.timestamp, node.numberOfTransactions];
                },
            );
        } catch (e) {
            console.error(e);
            return [];
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

    public getDateRange(period: PeriodType): DateRange {
        const end = new Date();
        const numberOfDays = this.getPeriodDurationInDays(period);

        const start = new Date();
        start.setDate(start.getDate() - numberOfDays);

        return {
            start,
            end,
        };
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

    private getPeriodDurationInDays(period: PeriodType): number {
        const parts = period.toString().split(' ');
        let numberOfDays: number;

        try {
            numberOfDays = Number(parts[0]) * (parts[1].startsWith('year') ? 365 : 1);
        } catch {
            numberOfDays = DEFAULT_RANGE_LENGTH_DAYS;
        }

        return numberOfDays;
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

        // // Current price
        // const result = await axios.get(
        //     `https://api.coingecko.com/api/v3/simple/price?ids=${network}&vs_currencies=usd`,
        // );
        const price = priceResult.data[network].usd;
        const utcNow = getDateUTC(new Date());

        return [utcNow.getTime(), totalStaked * price];
    }
}
