import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { injectable, inject } from 'inversify';
import container from '../container';
import { ContainerTypes } from '../containertypes';
import { Developer } from '../models/Dapp';
import { NetworkType } from '../networks';
import { IDappRadarService } from '../services/DappRadarService';
import { IDappsStakingService } from '../services/DappsStakingService';
import { IDappsStakingStatsService } from '../services/DappsStakingStatsService';
import { IFirebaseService } from '../services/FirebaseService';
import { PeriodType, PeriodTypeEra } from '../services/ServiceBase';
import { IStatsIndexerService } from '../services/StatsIndexerService';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';
import { IGiantSquidService } from '../services/GiantSquidService';
import { IDappsStakingEvents } from '../services/DappsStakingEvents';

@injectable()
export class DappsStakingController extends ControllerBase implements IControllerBase {
    constructor(
        @inject(ContainerTypes.StatsIndexerService) private _indexerService: IStatsIndexerService,
        @inject(ContainerTypes.FirebaseService) private _firebaseService: IFirebaseService,
        @inject(ContainerTypes.DappsStakingStatsService) private _statsService: IDappsStakingStatsService,
        @inject(ContainerTypes.DappRadarService) private _dappRadarService: IDappRadarService,
        @inject(ContainerTypes.GiantSquidService) private _giantSquidService: IGiantSquidService,
        @inject(ContainerTypes.DappsStakingEvents) private _dappsStakingEvents: IDappsStakingEvents,
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
                #swagger.tags = ['Dapps Staking']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
            */
            try {
                const network = req.params.network as NetworkType;
                const stakingService = container.getNamed<IDappsStakingService>(
                    ContainerTypes.DappsStakingService,
                    network,
                );
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
                #swagger.tags = ['Dapps Staking']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
            */
            try {
                const network = req.params.network as NetworkType;
                const stakingService = container.getNamed<IDappsStakingService>(
                    ContainerTypes.DappsStakingService,
                    network,
                );
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
                #swagger.tags = ['Dapps Staking']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
                #swagger.parameters['period'] = {
                    in: 'path',
                    description: 'The period type. Supported values: 7 days 30 days, 90 days, 1 year',
                    required: true,
                    enum: ['7 days', '30 days', '90 days', '1 year']
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
         * @description Dapps staking TVL route v3.
         */
        app.route('/api/v3/:network/dapps-staking/tvl/:period').get(async (req: Request, res: Response) => {
            /*
                        #swagger.description = 'Retrieves dapps staking TVL for a given network and period.'
                        #swagger.tags = ['Dapps Staking']
                        #swagger.parameters['network'] = {
                            in: 'path',
                            description: 'The network name. Supported networks: astar',
                            required: true,
                            enum: ['astar']
                        }
                        #swagger.parameters['period'] = {
                            in: 'path',
                            description: 'The period type. Supported values: 7 days 30 days, 90 days, 1 year',
                            required: true,
                            enum: ['1 day', '7 days', '30 days', '90 days', '1 year']
                        }
                    */
            res.json(
                await this._dappsStakingEvents.getDappStakingTvl(
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
                #swagger.tags = ['Dapps Staking']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
                #swagger.parameters['address'] = {
                    in: 'path',
                    description: 'Wallet address. Supported address format: SS58',
                    required: true,
                }
            */
            const network = req.params.network as NetworkType;
            const stakingService = container.getNamed<IDappsStakingService>(
                ContainerTypes.DappsStakingService,
                network,
            );
            res.json(await stakingService.getEarned(network, req.params.address as string));
        });

        app.route('/api/v1/:network/dapps-staking/dapps').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves list of dapps (full model) registered for dapps staking'
                #swagger.tags = ['Dapps Staking']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar, development',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
            */
            res.json(await this._firebaseService.getDappsFull(req.params.network as NetworkType));
        });

        app.route('/api/v1/:network/dapps-staking/dappssimple').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves list of dapps (basic info) registered for dapps staking'
                #swagger.tags = ['Dapps Staking']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar, development',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
            */
            res.json(await this._firebaseService.getDapps(req.params.network as NetworkType));
        });

        app.route('/api/v1/:network/dapps-staking/dapps/:address').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves dapp with the given address'
                #swagger.tags = ['Dapps Staking']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar, development',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
                #swagger.parameters['address'] = {
                    in: 'path',
                    description: 'The dapp address',
                    required: true
                }
            */

            try {
                const data = await this._firebaseService.getDapp(
                    req.params.address,
                    req.params.network as NetworkType,
                    req.query.forEdit?.toString()?.toLowerCase() === 'true',
                );

                if (data) {
                    res.json(data);
                } else {
                    this.handleNotFound(res);
                }
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        app.route('/api/v1/:network/dapps-staking/register').post(
            body('name').notEmpty().trim().escape(),
            body('description').notEmpty().trim().escape(),
            body('shortDescription').optional().trim().escape(),
            body('url').isURL(),
            body('license').notEmpty().trim().isIn(['GPL-3.0', 'MIT', 'GNU']),
            body('address').notEmpty().trim().escape(),
            body('iconFile').notEmpty(),
            body('iconFile.name').notEmpty().isString(),
            body('iconFile.contentType').isString().escape(),
            body('iconFile.base64content').isString().escape(),
            body('images').isArray({ min: 4 }),
            body('images.*.name').isString().escape(),
            body('images.*.contentType').isString().escape(),
            body('images.*.base64content').isString().escape(),
            body('senderAddress').notEmpty().trim().escape(),
            body('signature').notEmpty().trim().escape(),
            body('developers').isArray({ min: 2 }).withMessage('At least 2 developers are required'),
            body('developers.*.name').notEmpty().isString().escape(),
            body('developers.*.iconFile').notEmpty().isString().escape(),
            // Validate if at least one developer url is present.
            body('developers.*').custom((developer: Developer) => validateDeveloperLinks(developer)),
            body('communities').isArray({ min: 1 }).withMessage('At least 1 community is required'),
            body('communities.*.type').isIn([
                'Twitter',
                'Reddit',
                'Facebook',
                'TikTok',
                'YouTube',
                'Instagram',
                'Discord',
                'GitHub',
            ]),
            body('communities.*.handle').notEmpty().isURL(),
            body('contractType').notEmpty().isIn(['wasm+evm', 'wasm', 'evm']),
            body('mainCategory').notEmpty().isIn(['defi', 'nft', 'tooling', 'utility', 'others']),
            async (req: Request, res: Response) => {
                /*
                    #swagger.description = 'Registers a new dapp'
                    #swagger.tags = ['Dapps Staking']
                    #swagger.parameters['network'] = {
                        in: 'path',
                        description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar, development',
                        required: true,
                        enum: ['astar', 'shiden', 'shibuya', 'rocstar', 'development']
                    }
                */

                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                try {
                    const network = req.params.network as NetworkType;
                    const stakingService = container.getNamed<IDappsStakingService>(
                        ContainerTypes.DappsStakingService,
                        network,
                    );
                    const response = await stakingService.registerDapp(req.body, req.params.network as NetworkType);
                    res.json(response);
                } catch (e) {
                    this.handleError(res, e as Error);
                }
            },
        );

        app.route('/api/v1/:network/dapps-staking/stats/dapp/:contractAddress/:period').get(
            async (req: Request, res: Response) => {
                /*
                #swagger.description = 'Retrieves number of calls and unique users per era statistics.'
                #swagger.tags = ['Dapps Staking']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden',
                    required: true,
                    enum: ['astar', 'shiden']
                }
                #swagger.parameters['contractAddress'] = {
                    in: 'path',
                    description: 'Contract address to get stats for',
                    required: true
                }
                #swagger.parameters['period'] = {
                    in: 'path',
                    description: 'Period to get stats for. Supported periods: 7 eras, 30 eras, 90 eras, all',
                    required: true,
                    enum: ['7 eras', '30 eras', '90 eras', 'all']
                }
            */
                try {
                    res.json(
                        await this._statsService.getContractStatistics(
                            req.params.network as NetworkType,
                            req.params.contractAddress,
                            req.params.period as PeriodTypeEra,
                        ),
                    );
                } catch (err) {
                    this.handleError(res, err as Error);
                }
            },
        );

        app.route('/api/v1/:network/dapps-staking/stats/user/:userAddress/:period').get(
            async (req: Request, res: Response) => {
                /*
                #swagger.description = 'Retrieves user transactions.'
                #swagger.tags = ['Dapps Staking']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden',
                    required: true,
                    enum: ['astar', 'shiden']
                }
                #swagger.parameters['userAddress'] = {
                    in: 'path',
                    description: 'User address to get stats for',
                    required: true
                }
                #swagger.parameters['period'] = {
                    in: 'path',
                    description: 'The period type. Supported values: 7 days 30 days, 90 days, 1 year',
                    required: true,
                    enum: ['7 days', '30 days', '90 days', '1 year']
                }
            */
                // this._giantSquidService.getUserCalls(req.params.network as NetworkType, req.params.userAddress, req.params.period as PeriodType);
                try {
                    res.json(
                        await this._giantSquidService.getUserCalls(
                            req.params.network as NetworkType,
                            req.params.userAddress,
                            req.params.period as PeriodType,
                        ),
                    );
                } catch (err) {
                    this.handleError(res, err as Error);
                }
            },
        );

        app.route('/api/v3/:network/dapps-staking/stats/dapp/:contractAddress').get(
            async (req: Request, res: Response) => {
                /*
                    #swagger.description = 'Retrieves raw stats of dapps staking events with types for a given smart contract address.'
                    #swagger.tags = ['Dapps Staking']
                    #swagger.parameters['network'] = {
                        in: 'path',
                        description: 'The network name. Supported networks: astar',
                        required: true,
                        enum: ['astar']
                    }
                    #swagger.parameters['contractAddress'] = {
                        in: 'path',
                        description: 'Smart Contract address to get stats for',
                        required: true
                    }
                    #swagger.parameters['startDate'] = {
                        in: 'query',
                        description: 'Start date for filtering the staking events (inclusive). Format: YYYY-MM-DD',
                        required: true,
                        type: 'string',
                        format: 'date'
                    }
                    #swagger.parameters['endDate'] = {
                        in: 'query',
                        description: 'End date for filtering the staking events (inclusive). Format: YYYY-MM-DD',
                        required: true,
                        type: 'string',
                        format: 'date'
                    }
                    #swagger.parameters['limit'] = {
                        in: 'query',
                        description: 'Number of records to retrieve per page. Defaults to 100 if not provided.',
                        required: false,
                        type: 'integer',
                        format: 'int32',
                        default: 100
                    }
                    #swagger.parameters['offset'] = {
                        in: 'query',
                        description: 'Number of records to skip for pagination. Defaults to 0 if not provided.',
                        required: false,
                        type: 'integer',
                        format: 'int32',
                        default: 0
                    }
                */
                const startDate = req.query.startDate;
                const endDate = req.query.endDate;
                const limit = parseInt(req.query.limit as string, 10) || 100; // Default to 100 if not provided
                const offset = parseInt(req.query.offset as string, 10) || 0; // Default to 0 if not provided

                try {
                    res.json(
                        await this._dappsStakingEvents.getStakingEvents(
                            req.params.network as NetworkType,
                            req.params.contractAddress,
                            startDate as string,
                            endDate as string,
                            limit as number,
                            offset as number,
                        ),
                    );
                } catch (err) {
                    this.handleError(res, err as Error);
                }
            },
        );

        app.route('/api/v3/:network/dapps-staking/stats/aggregated/:period').get(
            async (req: Request, res: Response) => {
                /*
                    #swagger.description = 'Retrieves aggregated stats of dapps staking events for a given period.'
                    #swagger.tags = ['Dapps Staking']
                    #swagger.parameters['network'] = {
                        in: 'path',
                        description: 'The network name. Supported networks: astar',
                        required: true,
                        enum: ['astar']
                    }
                    #swagger.parameters['period'] = {
                        in: 'path',
                        description: 'The period type. Supported values: 7 days 30 days, 90 days, 1 year',
                        required: true,
                        enum: ['7 days', '30 days', '90 days', '1 year']
                    }
                */
                try {
                    res.json(
                        await this._dappsStakingEvents.getAggregatedData(
                            req.params.network as NetworkType,
                            req.params.period as PeriodType,
                        ),
                    );
                } catch (err) {
                    this.handleError(res, err as Error);
                }
            },
        );

        app.route('/api/v1/:network/dapps-staking/stats/transactions').get(async (req: Request, res: Response) => {
            /*
                #swagger.ignore = true
            */
            try {
                res.json(
                    await this._dappRadarService.getDappTransactionsHistory(
                        req.query.dappName as string,
                        req.query.dappUrl as string,
                        req.params.network as NetworkType,
                    ),
                );
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        app.route('/api/v1/:network/dapps-staking/stats/uaw').get(async (req: Request, res: Response) => {
            /*
                #swagger.ignore = true
            */
            try {
                res.json(
                    await this._dappRadarService.getDappUawHistory(
                        req.query.dappName as string,
                        req.query.dappUrl as string,
                        req.params.network as NetworkType,
                    ),
                );
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        app.route('/api/v1/:network/dapps-staking/stats/nexteraeta').get(async (req: Request, res: Response) => {
            /*
                #swagger.ignore = true
            */
            try {
                const network = req.params.network as NetworkType;
                const stakingService = container.getNamed<IDappsStakingService>(
                    ContainerTypes.DappsStakingService,
                    network,
                );
                res.json(await stakingService.getNextEraETA(network));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        app.route('/api/v1/:network/dapps-staking/stats/aggregated').get(async (req: Request, res: Response) => {
            /*
                #swagger.ignore = true
            */
            try {
                res.json(
                    await this._dappRadarService.getAggregatedData(
                        req.params.network as NetworkType,
                        req.query.period as string,
                    ),
                );
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });
    }
}

export function validateDeveloperLinks(developer: Developer): boolean {
    return true;

    const httpRegex =
        /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

    const isValid = {
        twitter: true,
        linkedIn: true,
        gitHub: true,
    };

    if (developer.twitterAccountUrl) {
        isValid.twitter = httpRegex.test(developer.twitterAccountUrl);
    }

    if (developer.linkedInAccountUrl) {
        isValid.linkedIn = httpRegex.test(developer.linkedInAccountUrl);
    }

    if (developer.githubAccountUrl) {
        isValid.gitHub = httpRegex.test(developer.githubAccountUrl);
    }

    return (
        Boolean(developer.twitterAccountUrl || developer.linkedInAccountUrl || developer.githubAccountUrl) &&
        isValid.linkedIn &&
        isValid.twitter &&
        isValid.gitHub
    );
}
