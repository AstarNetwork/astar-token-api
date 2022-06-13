import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { NetworkType } from '../networks';
import { IDappsStakingService } from '../services/DappsStakingService';
import { IFirebaseService } from '../services/FirebaseService';
import { IStatsIndexerService, PeriodType } from '../services/StatsIndexerService';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';

@injectable()
export class DappsStakingController extends ControllerBase implements IControllerBase {
    constructor(
        @inject('DappsStakingService') private _stakingService: IDappsStakingService,
        @inject('StatsIndexerService') private _indexerService: IStatsIndexerService,
        @inject('FirebaseService') private _firebaseService: IFirebaseService,
    ) {
        super();
    }

    public register(app: express.Application): void {
        /**
         * @description Dapps staking APR route
         */
        app.route('/api/v1/:network/dapps-staking/apr').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves dapp staking APR for a given network.'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
            */
            try {
                res.json(await this._stakingService.calculateApr(req.params.network as NetworkType));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description Dapps staking APY route
         */
        app.route('/api/v1/:network/dapps-staking/apy').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves dapp staking APY for a given network.'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
            */
            try {
                res.json(await this._stakingService.calculateApy(req.params.network as NetworkType));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description Dapps staking TVL rout v1.
         */
        app.route('/api/v1/:network/dapps-staking/tvl/:period').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves dapps staking TVL for a given network and period.'
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
            res.json(
                await this._indexerService.getDappStakingTvl(
                    req.params.network as NetworkType,
                    req.params.period as PeriodType,
                ),
            );
        });

        /**
         * @description Dapps staking TVL rout v1.
         */
        app.route('/api/v1/:network/dapps-staking/earned/:address').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves earned staking rewards for dapps staking'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
                #swagger.parameters['address'] = {
                    in: 'path',
                    description: 'Wallet address. Supported address format: SS58',
                    required: true,
                }
            */
            res.json(
                await this._stakingService.getEarned(req.params.network as NetworkType, req.params.address as string),
            );
        });

        app.route('/api/v1/:network/dapps-staking/dapps').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves list of dapps registered for dapps staking'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, development',
                    required: true
                }
            */
            res.json(await this._firebaseService.getDapps(req.params.network as NetworkType));
        });
    }
}
