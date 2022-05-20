import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { NetworkType } from '../networks';
import { IGasService } from '../services/GasService';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';

@injectable()
export class GasController extends ControllerBase implements IControllerBase {
    constructor(@inject('GasService') private _gasService: IGasService) {
        super();
    }

    public register(app: express.Application): void {
        /**
         * @description Dapps staking APR route
         */
        app.route('/api/v1/:network/gasnow').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves gas for a given network.'
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true
                }
            */
            try {
                res.json(await this._gasService.gasNow(req.params.network as NetworkType));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });
    }
}
