import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { NetworkType } from '../networks';
import { IDappsStakingService } from '../services/DappsStakingService';
import { IControllerBase } from './IControllerBase';

@injectable()
export class DappsStakingController implements IControllerBase {
    constructor(@inject('DappsStakingService') private _stakingService: IDappsStakingService) {}

    public register(app: express.Application): void {
        /**
        * @description Dapps staking APR route
        */
        app.route('/api/v1/:network/dapps-staking/apr').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retreives dapp staking APR for a given network.'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
            */
            res.json(await this._stakingService.calculateApr(req.params.network as NetworkType));
        });

        /**
        * @description Dapps staking APY route
        */
        app.route('/api/v1/:network/dapps-staking/apy').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retreives dapp staking APY for a given network.'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
            */
            res.json(await this._stakingService.calculateApy(req.params.network as NetworkType));
        });
    }
}
