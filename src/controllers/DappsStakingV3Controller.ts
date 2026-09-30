import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { ContainerTypes } from '../containertypes';
import { NetworkType } from '../networks';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';
import { IDappsStakingEvents } from '../services/DappsStakingEvents';

/**
 * Routes backed by the retired dApp staking indexer. Kept registered so callers get an explicit 410
 * instead of a 404 or stale data.
 */
const RETIRED_ROUTES = [
    '/api/v3/:network/dapps-staking/tvl/:period',
    '/api/v3/:network/dapps-staking/stakers-total/:period',
    '/api/v3/:network/dapps-staking/lockers-total/:period',
    '/api/v3/:network/dapps-staking/lockers-and-stakers-total/:period',
    '/api/v3/:network/dapps-staking/stakerscount/:contractAddress/:period',
    '/api/v3/:network/dapps-staking/stakerslist/:contractAddress',
    '/api/v3/:network/dapps-staking/stakerscount-total/:period',
    '/api/v3/:network/dapps-staking/stats/dapp/:contractAddress',
    '/api/v3/:network/dapps-staking/stats/aggregated/:period',
    '/api/v3/:network/dapps-staking/rewards/:period',
    '/api/v3/:network/dapps-staking/rewards-aggregated/:address/:period',
    '/api/v3/:network/dapps-staking/period-aggregated/:period',
    '/api/v3/:network/dapps-staking/staker-aggregated/:address',
    '/api/v3/:network/dapps-staking/staker-aggregated-total/:address',
];

@injectable()
export class DappsStakingV3Controller extends ControllerBase implements IControllerBase {
    constructor(@inject(ContainerTypes.DappsStakingEvents) private _dappsStakingEvents: IDappsStakingEvents) {
        super();
    }

    public register(app: express.Application): void {
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

        app.route('/api/v3/:network/dapps-staking/stake-info/:address').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retrieves the amount of stake of participant'
                #swagger.tags = ['Dapps Staking']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar, shiden, shibuya',
                    required: true,
                    enum: ['astar', 'shiden', 'shibuya']
                }
                #swagger.parameters['address'] = {
                    in: 'path',
                    description: 'Participant address to get stats for',
                    required: true
                }
            */
            res.json(
                await this._dappsStakingEvents.getParticipantStake(
                    req.params.network as NetworkType,
                    req.params.address as string,
                ),
            );
        });

        app.route('/api/v3/:network/dapps-staking/get-period-range/:period').get(
            async (req: Request, res: Response) => {
                /*
                    #swagger.description = 'Retreives the start and end block numbers for the given dApp staking period.'
                    #swagger.tags = ['Dapps Staking']
                    #swagger.parameters['network'] = {
                        in: 'path',
                        description: 'The network name. Supported networks: astar',
                        required: true,
                        enum: ['astar', 'shiden', 'shibuya']
                    }
                    #swagger.parameters['period'] = {
                        in: 'path',
                        description: 'dApp staking period.',
                        required: true,
                    }
                */
                try {
                    res.json(
                        await this._dappsStakingEvents.getPeriodBlockRange(
                            req.params.network as NetworkType,
                            Number(req.params.period),
                        ),
                    );
                } catch (err) {
                    this.handleError(res, err as Error);
                }
            },
        );

        RETIRED_ROUTES.forEach((route) => {
            app.route(route).get(async (_req: Request, res: Response) => {
                this.handleRetired(res);
            });
        });
    }
}
