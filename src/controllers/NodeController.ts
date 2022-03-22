import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { IStatsIndexerService, PeriodType } from '../services/StatsIndexerService';
import { IControllerBase } from './IControllerBase';

@injectable()
export class NodeController implements IControllerBase {
    constructor(@inject('StatsIndexerService') private _indexerService: IStatsIndexerService) {}

    public register(app: express.Application): void {
        /**
         * @description Transactions per block route v1.
         */
        app.route('/api/v1/:network/node/tx-perblock/:period').get(async (req: Request, res: Response) => {
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
