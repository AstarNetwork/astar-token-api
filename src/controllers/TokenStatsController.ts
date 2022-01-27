import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { ContainerTypes } from '../container';
import { IStatsService } from '../services/StatsService';
import { IControllerBase } from './IControllerBase';

@injectable()
export class TokenStatsController implements IControllerBase {
    constructor(@inject('StatsService') private _statsService: IStatsService) {}

    public register(app: express.Application): void {
        app.route('/api/tokenstats').get(async (req: Request, res: Response) => {
            res.json(await this._statsService.getTokenStats());
        });
    }
}
