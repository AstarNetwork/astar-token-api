import express, { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';
import { ContainerTypes } from '../containertypes';
import { IBurnService } from '../services/BurnService';
import { NetworkType } from '../networks';

@injectable()
export class BurnController extends ControllerBase implements IControllerBase {
    constructor(@inject(ContainerTypes.BurnService) private _burnService: IBurnService) {
        super();
    }

    public register(app: express.Application): void {
        /**
         * @description Burn events route
         */
        app.route('/api/v1/:network/burn/events').get(async (req: Request, res: Response) => {
            /*
              #swagger.description = 'Retrieves burn events for a given network.'
              #swagger.tags = ['Burn']
              #swagger.parameters['network'] = {
                  in: 'path',
                  description: 'The network name. Supported networks: astar, shiden, shibuya',
                  required: true,
                  enum: ['astar', 'shiden', 'shibuya']
              }
          */
            try {
                const network = req.params.network as NetworkType;
                res.json(await this._burnService.getBurnEvents(network));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });
    }
}
