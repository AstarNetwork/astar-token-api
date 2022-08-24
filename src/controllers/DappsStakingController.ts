import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { injectable, inject } from 'inversify';
import container from '../container';
import { ContainerTypes } from '../containertypes';
import { NetworkType } from '../networks';
import { IDappsStakingService } from '../services/DappsStakingService';
import { IFirebaseService } from '../services/FirebaseService';
import { IStatsIndexerService, PeriodType } from '../services/StatsIndexerService';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';

@injectable()
export class DappsStakingController extends ControllerBase implements IControllerBase {
    constructor(
        @inject(ContainerTypes.StatsIndexerService) private _indexerService: IStatsIndexerService,
        @inject(ContainerTypes.FirebaseService) private _firebaseService: IFirebaseService,
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
                const network = req.params.network as NetworkType;
                const stakingService = container.getNamed<IDappsStakingService>(ContainerTypes.DappsStakingService, network);
                res.json(await stakingService.calculateApr(network));
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
                const network = req.params.network as NetworkType;
                const stakingService = container.getNamed<IDappsStakingService>(ContainerTypes.DappsStakingService, network);
                res.json(await stakingService.calculateApy(network));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description Dapps staking TVL route v1.
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
         * @description Dapps staking TVL route v1.
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
            const network = req.params.network as NetworkType;
            const stakingService = container.getNamed<IDappsStakingService>(ContainerTypes.DappsStakingService, network);   
            res.json(await stakingService.getEarned(network, req.params.address as string));
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

        app.route('/api/v1/:network/dapps-staking/register').post(
            body('name').not().isEmpty().trim().escape(),
            body('description').not().isEmpty().trim().escape(),
            body('url').isURL(),
            body('license').not().isEmpty().trim().escape(),
            body('address').not().isEmpty().trim().escape(),
            body('tags').isArray({ min: 1 }),
            body('tags.*').not().isEmpty().trim().escape(), // validate if tags array elements are strings
            body('forumUrl').not().isEmpty().isURL(),
            body('gitHubUrl').not().isEmpty().isURL(),
            body('iconFile').not().isEmpty(),
            body('iconFile.name').not().isEmpty().isString(),
            body('iconFile.contentType').isString(),
            body('iconFile.base64content').isString(),
            body('images').isArray({ min: 4 }),
            body('images.*.name').isString(),
            body('images.*.contentType').isString(),
            body('images.*.base64content').isString(),
            body('senderAddress').not().isEmpty().trim().escape(),
            body('signature').not().isEmpty().trim().escape(),
            async (req: Request, res: Response) => {
                /*
                    #swagger.description = 'Registers a new dapp'
                    #swagger.parameters['network'] = {
                        in: 'path',
                        description: 'The network name. Supported networks: astar, shiden, shibuya, development',
                        required: true
                    }
                */

                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                try {
                    const network = req.params.network as NetworkType;
                    const stakingService = container.getNamed<IDappsStakingService>(ContainerTypes.DappsStakingService, network);
                    const response = await stakingService.registerDapp(
                        req.body,
                        req.params.network as NetworkType,
                    );
                    res.json(response);
                } catch (e) {
                    this.handleError(res, e as Error);
                }
            },
        );
    }
}
