import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { ContainerTypes } from '../containertypes';
import { NetworkType } from '../networks';
import { IPriceProvider } from '../services/IPriceProvider';
import { PeriodType } from '../services/ServiceBase';
import { IStatsIndexerService } from '../services/StatsIndexerService';
import { IStatsService } from '../services/StatsService';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';

@injectable()
export class TokenStatsController extends ControllerBase implements IControllerBase {
    constructor(
        @inject(ContainerTypes.StatsService) private _statsService: IStatsService,
        @inject(ContainerTypes.StatsIndexerService) private _indexerService: IStatsIndexerService,
        @inject(ContainerTypes.PriceProviderWithFailover) private _priceProvider: IPriceProvider,
    ) {
        super();
    }

    public register(app: express.Application): void {
        /**
         * @description Test route
         */
        app.route('/api/token/stats').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Test endpoint, returns token stats for Astar Network'
            */
            try {
                res.json(await this._statsService.getTokenStats('astar'));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description Token statistics route. Used by exchanges.
         */
        app.route('/api/:network/token/stats').get(async (req: Request, res: Response) => {
            /*
                #swagger.ignore = true
            */
            try {
                res.json(await this._statsService.getTokenStats(req.params.network as NetworkType));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description Token current price route v1.
         */
        app.route('/api/v1/token/price/:symbol').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves current token price'
                #swagger.tags = ['Token']
                #swagger.parameters['symbol'] = {
                    in: 'path',
                    description: 'Token symbol (eg. ASTR or SDN)',
                    required: true,
                    enum: ['ASTR', 'SDN']
                }
            */
            try {
                const currency = req.query.currency as string | undefined;
                res.json(await this._priceProvider.getPrice(req.params.symbol, currency));
            } catch (err) {
                // For the sake of backward compatibility
                res.json(0);
            }
        });

        /**
         * @description Token statistics route v1.
         */
        app.route('/api/v1/:network/token/stats').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves token statistics for a given network.'
                #swagger.tags = ['Token']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
            */
            try {
                res.json(await this._statsService.getTokenStats(req.params.network as NetworkType));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description Test route
         */
        app.route('/api/token/circulation').get(async (req: Request, res: Response) => {
            /*
                #swagger.ignore = true
            */
            try {
                res.json(await (await this._statsService.getTokenStats('astar')).circulatingSupply);
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description Token circulation route. Used by exchanges.
         */
        app.route('/api/:network/token/circulation').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves a token circulation supply for a given network.'
                #swagger.tags = ['Token']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
            */
            try {
                res.json(
                    await (
                        await this._statsService.getTokenStats(req.params.network as NetworkType)
                    ).circulatingSupply,
                );
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description Token circulation route v1.
         */
        app.route('/api/v1/:network/token/circulation').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves token circulation for a given network.'
                #swagger.tags = ['Token']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
            */
            try {
                res.json(
                    await (
                        await this._statsService.getTokenStats(req.params.network as NetworkType)
                    ).circulatingSupply,
                );
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description Token total supply.
         */
        app.route('/api/v1/:network/token/supply').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves a token total supply for a given network.'
                #swagger.tags = ['Token']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
            */
            try {
                res.json(await this._statsService.getTotalSupply(req.params.network as NetworkType));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description Token price route v1.
         */
        app.route('/api/v1/:network/token/price/:period').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves token price for a given network and period.'
                #swagger.tags = ['Token']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
                #swagger.parameters['period'] = {
                    in: 'path',
                    description: 'The period type.  Supported values: 7 days 30 days, 90 days, 1 year',
                    required: true,
                    enum: ['7 days', '30 days', '90 days', '1 year']
                }
            */
            res.json(
                await this._indexerService.getPrice(req.params.network as NetworkType, req.params.period as PeriodType),
            );
        });

        /**
         * @description Token TVL route v1.
         */
        app.route('/api/v1/:network/token/tvl/:period').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves token TVL for a given network and period.'
                #swagger.tags = ['Token']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
                #swagger.parameters['period'] = {
                    in: 'path',
                    description: 'The period type.  Supported values: 7 days 30 days, 90 days, 1 year',
                    required: true,
                    enum: ['7 days', '30 days', '90 days', '1 year']
                }
            */
            res.json(
                await this._indexerService.getTvl(req.params.network as NetworkType, req.params.period as PeriodType),
            );
        });

        /**
         * @description Token Holders.
         */
        app.route('/api/v1/:network/token/holders').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves number of token holders'
                #swagger.tags = ['Token']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya, rocstar',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya', 'rocstar']
                }
            */
            res.json(await this._indexerService.getHolders(req.params.network as NetworkType));
        });
    }
}
