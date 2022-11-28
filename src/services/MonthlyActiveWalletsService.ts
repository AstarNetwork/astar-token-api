import { injectable } from 'inversify';
import axios from 'axios';
import { UsersCount, UniqueWalletsCount } from '../models/MonthlyActiveWallets';
import { NetworkType } from '../networks';
import { PeriodType } from './ServiceBase';

const ASTAR_INDEXER_URL = 'https://subquery.astar.network/astar';

export interface IMonthlyActiveWalletsService {
    getDailyData(period: PeriodType, network: NetworkType): Promise<UsersCount[]>;
    getUniqueWalletsCount(period: PeriodType, network: NetworkType): Promise<UniqueWalletsCount>;
    getMonthlyData(numberOfMonths: number, network: NetworkType): Promise<UsersCount[]>;
}

@injectable()
export class MonthlyActiveWalletsService implements IMonthlyActiveWalletsService {
    public async getDailyData(period: PeriodType, network: NetworkType): Promise<UsersCount[]> {
        this.checkNetwork(network);
        this.checkPeriod(period);

        const numberOdDays = this.getNumberOfDaysFromPeriod(period);
        const result = await axios.post(ASTAR_INDEXER_URL, {
            query: `query { dailyCounts (last: ${numberOdDays}, orderBy:ID_ASC) { nodes { id, nativeActiveUsers, evmActiveUsers} } }`,
        });

        return <UsersCount[]>result.data.data.dailyCounts.nodes;
    }

    public async getUniqueWalletsCount(period: PeriodType, network: NetworkType): Promise<UniqueWalletsCount> {
        this.checkNetwork(network);
        this.checkPeriod(period);

        const data = await this.getDailyData(period, network);
        const native = new Map();
        const evm = new Map();
        data.map((item) => {
            item.nativeActiveUsers.map((x) => {
                if (!native.has(x)) {
                    native.set(x, 1);
                }
            });

            item.evmActiveUsers.map((x) => {
                if (!evm.has(x)) {
                    evm.set(x, 1);
                }
            });
        });

        return {
            nativeUniqueCount: native.size,
            evmUniqueCount: evm.size,
        };
    }

    public async getMonthlyData(numberOfMonths = 12, network: NetworkType): Promise<UsersCount[]> {
        if (numberOfMonths < 1) {
            throw new Error('Number of months must be greater or equal to 1');
        }
        this.checkNetwork(network);

        const result = await axios.post(ASTAR_INDEXER_URL, {
            query: `query { monthlyCounts (last:${numberOfMonths}, orderBy:ID_ASC) { nodes { id, nativeActiveUsers, evmActiveUsers} } }`,
        });

        return <UsersCount[]>result.data.data.monthlyCounts.nodes;
    }

    private checkPeriod(period: PeriodType) {
        if (period !== '30 days' && period !== '7 days') {
            throw new Error(`Period ${period} is not supported.`);
        }
    }

    private checkNetwork(network: NetworkType) {
        if (network !== 'astar') {
            throw new Error(`Network ${network} is not supported yet.`);
        }
    }

    private getNumberOfDaysFromPeriod(period: PeriodType) {
        return parseInt(period.split(' ')[0]);
    }
}
