import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { ContainerTypes } from '../containertypes';
import { NetworkType } from '../networks';
import { PeriodType } from '../services/ServiceBase';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';
import { IDappsStakingEvents } from '../services/DappsStakingEvents';

@injectable()
export class DappsStakingV3Controller extends ControllerBase implements IControllerBase {
    constructor(@inject(ContainerTypes.DappsStakingEvents) private _dappsStakingEvents: IDappsStakingEvents) {
        super();
    }

    public register(app: express.Application): void {
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
                            enum: ['astar', 'shiden', 'shibuya']
                        }
                        #swagger.parameters['period'] = {
                            in: 'path',
                            description: 'The period type. Supported values: 1 day, 7 days, 30 days, 90 days, 1 year',
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

        app.route('/api/v3/:network/dapps-staking/stakerscount/:contractAddress/:period').get(
            async (req: Request, res: Response) => {
                /*
                        #swagger.description = 'Retrieves dapps staking stakers count for a given network and period.'
                        #swagger.tags = ['Dapps Staking']
                        #swagger.parameters['network'] = {
                            in: 'path',
                            description: 'The network name. Supported networks: astar',
                            required: true,
                            enum: ['astar', 'shiden', 'shibuya']
                        }
                        #swagger.parameters['contractAddress'] = {
                            in: 'path',
                            description: 'Contract address to get stats for',
                            required: true
                        }
                        #swagger.parameters['period'] = {
                            in: 'path',
                            description: 'The period type. Supported values: 1 day, 7 days, 30 days, 90 days, 1 year',
                            required: true,
                            enum: ['1 day', '7 days', '30 days', '90 days', '1 year']
                        }
                    */
                res.json(
                    await this._dappsStakingEvents.getDappStakingStakersCount(
                        req.params.network as NetworkType,
                        req.params.contractAddress as string,
                        req.params.period as PeriodType,
                    ),
                );
            },
        );

        app.route('/api/v3/:network/dapps-staking/chaindapps').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves list of dapps (basic info) registered for dapps staking'
                #swagger.tags = ['Dapps Staking']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya']
                }
            */
            res.json(await this._dappsStakingEvents.getDapps(req.params.network as NetworkType));
        });

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

        app.route('/api/v3/:network/dapps-staking/rewards/:period').get(async (req: Request, res: Response) => {
            /*
                    #swagger.description = 'Retrieves dapps staking rewards for a given network and period.'
                    #swagger.tags = ['Dapps Staking']
                    #swagger.parameters['network'] = {
                        in: 'path',
                        description: 'The network name. Supported networks: astar',
                        required: true,
                        enum: ['astar', 'shiden', 'shibuya']
                    }
                    #swagger.parameters['period'] = {
                        in: 'path',
                        description: 'The period type. Supported values: 1 day, 7 days, 30 days, 90 days, 1 year',
                        required: true,
                        enum: ['1 day', '7 days', '30 days', '90 days', '1 year']
                    }
                */
            res.json(
                await this._dappsStakingEvents.getDappStakingRewards(
                    req.params.network as NetworkType,
                    req.params.period as PeriodType,
                ),
            );
        });

        app.route('/api/v3/:network/dapps-staking/rewards-aggregated/:address/:period').get(
            async (req: Request, res: Response) => {
                /*
                    #swagger.description = 'Retrieves dapps staking rewards for a given network and period.'
                    #swagger.tags = ['Dapps Staking']
                    #swagger.parameters['network'] = {
                        in: 'path',
                        description: 'The network name. Supported networks: astar',
                        required: true,
                        enum: ['astar', 'shiden', 'shibuya']
                    }
                    #swagger.parameters['address'] = {
                        in: 'path',
                        description: 'User address or contract address who received rewards',
                        required: true
                    }
                    #swagger.parameters['period'] = {
                        in: 'path',
                        description: 'The period type. Supported values: 1 day, 7 days, 30 days, 90 days, 1 year',
                        required: true,
                        enum: ['1 day', '7 days', '30 days', '90 days', '1 year']
                    }
                */
                res.json(
                    await this._dappsStakingEvents.getDappStakingRewardsAggregated(
                        req.params.network as NetworkType,
                        req.params.address as string,
                        req.params.period as PeriodType,
                    ),
                );
            },
        );
    }
}
