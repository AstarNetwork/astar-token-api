import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { NetworkType } from '../networks';
import { IDappsStakingService } from '../services/DappsStakingService';
import { IControllerBase } from './IControllerBase';

@injectable()
export class DappsStakingController implements IControllerBase {
    constructor(@inject('DappsStakingService') private _stakingService: IDappsStakingService) {}

    public register(app: express.Application): void {
        app.route('/api/:network/dapps-staking/apr').get(async (req: Request, res: Response) => {
            res.json(await this._stakingService.calculateApr(req.params.network as NetworkType));
        });
    }
}
