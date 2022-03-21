import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { NetworkType } from '../networks';
import { IStatsIndexerService, PeriodType } from '../services/StatsIndexerService';
import { IStatsService } from '../services/StatsService';
import { IControllerBase } from './IControllerBase';

@injectable()
export class TokenStatsController implements IControllerBase {
    constructor(
        @inject('StatsService') private _statsService: IStatsService,
        @inject('StatsIndexerService') private _indexerService: IStatsIndexerService,
    ) {}

    public register(app: express.Application): void {
        /**
         * @description Test route
         */
        app.route('/api/token/stats').get(async (req: Request, res: Response) => {
            // #swagger.ignore = true
            res.json(await this._statsService.getTokenStats());
        });

        /**
         * @description Token statistics route. Used by exchanges.
         */
        app.route('/api/:network/token/stats').get(async (req: Request, res: Response) => {
            // #swagger.ignore = true
            res.json(await this._statsService.getTokenStats(req.params.network as NetworkType));
        });

        /**
         * @description Token statistics route v1.
         */
        app.route('/api/v1/:network/token/stats').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retreives token staticstics for a given network.'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
            */
            res.json(await this._statsService.getTokenStats(req.params.network as NetworkType));
        });

        /**
         * @description Test route
         */
        app.route('/api/token/circulation').get(async (req: Request, res: Response) => {
            // #swagger.ignore = true
            res.json(await (await this._statsService.getTokenStats()).circulatingSupply);
        });

        /**
         * @description Token circulation route. Used by exchanges.
         */
        app.route('/api/:network/token/circulation').get(async (req: Request, res: Response) => {
            // #swagger.ignore = true
            res.json(
                await (
                    await this._statsService.getTokenStats(req.params.network as NetworkType)
                ).circulatingSupply,
            );
        });

        /**
         * @description Token circulation route v1.
         */
        app.route('/api/v1/:network/token/circulation').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retreives token circulation for a given network.'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
            */
            res.json(
                await (
                    await this._statsService.getTokenStats(req.params.network as NetworkType)
                ).circulatingSupply,
            );
        });

        /**
         * @description Token price route v1.
         */
        app.route('/api/v1/:network/token/price/:period').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retreives token price for a given network and period.'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
                #swagger.parameters['period'] = {
                    in: 'path',
                    description: 'The period type.',
                    required: true,
                    enum:
                        - "7 days"
                        - "30 days"
                        - "90 days"
                        - "1 year"
                }
            */
            res.json(
                await this._indexerService.getPrice(req.params.network as NetworkType, req.params.period as PeriodType),
            );
        });

        /**
         * @description Transactions per block route v1.
         */
        app.route('/api/v1/:network/token/tx-perblock/:period').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retreives token price for a given network and period.'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
                #swagger.parameters['period'] = {
                    in: 'path',
                    description: 'The period type.',
                    required: true,
                    enum:
                        - "7 days"
                        - "30 days"
                        - "90 days"
                        - "1 year"
                }
            */
            res.json(await this._indexerService.getTransactionsPerBlock(req.params.period as PeriodType));
        });
    }
}
