import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { NetworkType } from '../networks';
import { IStatsService } from '../services/StatsService';
import { IControllerBase } from './IControllerBase';

@injectable()
export class TokenStatsController implements IControllerBase {
    constructor(@inject('StatsService') private _statsService: IStatsService) {}

    public register(app: express.Application): void {
        app.route('/api/token/stats').get(async (req: Request, res: Response) => {
            res.json(await this._statsService.getTokenStats());
        });
        app.route('/api/:network/token/stats').get(async (req: Request, res: Response) => {
            res.json(await this._statsService.getTokenStats(req.params.network as NetworkType));
        });
        app.route('/api/token/circulation').get(async (req: Request, res: Response) => {
            res.json(await (await this._statsService.getTokenStats()).circulatingSupply);
        });
        app.route('/api/:network/token/circulation').get(async (req: Request, res: Response) => {
            res.json(
                await (
                    await this._statsService.getTokenStats(req.params.network as NetworkType)
                ).circulatingSupply,
            );
        });
    }
}
