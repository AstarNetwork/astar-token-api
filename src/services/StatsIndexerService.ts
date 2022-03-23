import axios from 'axios';
import { injectable } from 'inversify';
import { networks, NetworkType } from '../networks';

export type PeriodType = '7 days' | '30 days' | '90 days' | '1 year';
export type Pair = { date: number; value: number };
export type DateRange = { start: Date; end: Date };

export interface IStatsIndexerService {
    getTvl(period: PeriodType): Promise<Pair[]>;

    getTransactionsPerBlock(period: PeriodType): Promise<Pair[]>;

    getPrice(network: NetworkType, period: PeriodType): Promise<Pair[]>;
}

const DEFAULT_RANGE_LENGTH_DAYS = 7;
const API_URL = 'https://api.subquery.network/sq/bobo-k2/astar-statistics__Ym9ib';

@injectable()
/**
 * Fetches statistics from external data source
 */
export class StatsIndexerService implements IStatsIndexerService {
    public async getTvl(period: PeriodType): Promise<Pair[]> {
        const range = this.getDateRange(period);
        const result = await axios.post(API_URL, {
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

        return result.data.data.tvls.nodes.map((node: { timestamp: string; tvlUsd: number }) => {
            return [node.timestamp, node.tvlUsd];
        });
    }

    public async getTransactionsPerBlock(period: PeriodType): Promise<Pair[]> {
        const range = this.getDateRange(period);
        const result = await axios.post(API_URL, {
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
    }

    public async getPrice(network = 'astar', period: PeriodType): Promise<Pair[]> {
        const numberOfDays = this.getPeriodDurationInDays(period);
        const result = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${network}/market_chart?vs_currency=usd&days=${numberOfDays}&interval=daily`,
        );
        return result.data.prices;
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
}
