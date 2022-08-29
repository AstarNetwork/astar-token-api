import express, { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ContainerTypes } from '../containertypes';
import { NetworkType } from '../networks';
import { ITxQueryService } from './../services/TxQueryService';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';

@injectable()
export class TxQueryController extends ControllerBase implements IControllerBase {
    constructor(@inject(ContainerTypes.TxQueryService) private _txQueryService: ITxQueryService) {
        super();
    }

    public register(app: express.Application): void {
        /**
         * @description Query the transfer details
         */
        app.route('/api/v1/:network/tx/transfer').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Return the transfer transaction detail of a given hash'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
                #swagger.parameters['hash'] = {
                    in: 'query',
                    description: 'Transaction hash',
                    required: true,
                }
            */
            try {
                const network = req.params.network as NetworkType;
                const hash = req.query.hash as string;
                res.json(await this._txQueryService.fetchTransferDetails(network, hash));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });
    }
}
