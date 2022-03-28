import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { NetworkType } from '../networks';
import { IDappsStakingService } from '../services/DappsStakingService';
import { IStatsIndexerService, PeriodType } from '../services/StatsIndexerService';
import { IControllerBase } from './IControllerBase';

@injectable()
export class DappsStakingController implements IControllerBase {
    constructor(
        @inject('DappsStakingService') private _stakingService: IDappsStakingService,
        @inject('StatsIndexerService') private _indexerService: IStatsIndexerService,
    ) {}

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

        /**
         * @description Dapps staking TVL rout v1.
         */
        app.route('/api/v1/:network/dapps-staking/tvl/:period').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retreives dapps staking TVL for a given network and period.'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
                #swagger.parameters['period'] = {
                    in: 'path',
                    description: 'The period type. Supported values: 7 days 30 days, 90 days, 1 year',
                    required: true,
                }
            */
            res.json(await this._indexerService.getDappStakingTvl(req.params.network as NetworkType, req.params.period as PeriodType));
        });
    }
}
