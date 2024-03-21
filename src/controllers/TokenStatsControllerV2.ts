import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { ContainerTypes } from '../containertypes';
import { IPriceProvider } from '../services/IPriceProvider';
import { IStatsIndexerService } from '../services/StatsIndexerService';
import { IStatsService } from '../services/StatsService';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';

@injectable()
export class TokenStatsControllerV2 extends ControllerBase implements IControllerBase {
    constructor(
        @inject(ContainerTypes.StatsService) private _statsService: IStatsService,
        @inject(ContainerTypes.StatsIndexerService) private _indexerService: IStatsIndexerService,
        @inject(ContainerTypes.PriceProviderWithFailover) private _priceProvider: IPriceProvider,
    ) {
        super();
    }

    public register(app: express.Application): void {
        /**
         * @description Token current price route v2.
         */
        app.route('/api/v2/token/price/:symbol').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves current token price with timestamp'
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
                res.json(await this._priceProvider.getPriceWithTimestamp(req.params.symbol, currency));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });
    }
}
