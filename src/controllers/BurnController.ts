import express, { Request, Response } from 'express';
import { injectable } from 'inversify';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';

@injectable()
export class BurnController extends ControllerBase implements IControllerBase {
    public register(app: express.Application): void {
        /**
         * @description Burn events route. Retired together with the dApp staking indexer.
         */
        app.route('/api/v1/:network/burn/events').get(async (_req: Request, res: Response) => {
            this.handleRetired(res);
        });
    }
}
