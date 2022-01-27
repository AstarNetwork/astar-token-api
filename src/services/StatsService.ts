import { injectable, inject } from 'inversify';
import { IAstarApi } from '../client/AstarApi';
import { TokenStats } from '../models/TokenStats';

export interface IStatsService {
    getTokenStats(): Promise<TokenStats>;
}

@injectable()
export class StatsService implements IStatsService {
    constructor(@inject('api') private _api: IAstarApi) {}

    public async getTokenStats(): Promise<TokenStats> {
        const supply = await this._api.getTotalSupply();
        return new TokenStats(123, supply.toString(), 'vv');
    }
}
