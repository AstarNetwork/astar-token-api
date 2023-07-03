import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { ContainerTypes } from '../containertypes';
import { UsersCount } from '../models/MonthlyActiveWallets';
import { NetworkType } from '../networks';
import { IMonthlyActiveWalletsService } from '../services/MonthlyActiveWalletsService';
import { PeriodType } from '../services/ServiceBase';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';

@injectable()
export class MonthlyActiveWalletsController extends ControllerBase implements IControllerBase {
    constructor(@inject(ContainerTypes.MonthlyActiveWalletsService) private _mawService: IMonthlyActiveWalletsService) {
        super();
    }

    public register(app: express.Application): void {
        app.route('/api/v1/:network/maw/daily/:period').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Retreives daily wallets statistics in CSV format'
                #swagger.tags = ['MAW']
                #swagger.parameters['network'] = {
                    in: 'path',
                    description: 'The network name. Supported networks: astar',
                    required: true,
                    enum: ['astar']
                }
                #swagger.parameters['period'] = {
                    in: 'path',
                    description: 'The period type.  Supported values: 7 days, 30 days',
                    required: true,
                    enum: ['7 days', '30 days']
                }
            */

            try {
                const network = req.params.network as NetworkType;
                const period = req.params.period as PeriodType;
                const data = await this._mawService.getDailyData(period, network);

                // Generate and return CSV
                const csv = this.generateCsv(data);
                res.header('Content-Type', 'text/csv');
                res.attachment('daily.csv');

                return res.send(csv);
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        app.route('/api/v1/:network/maw/daily/unique/:period').get(async (req: Request, res: Response) => {
            /*
              #swagger.description = 'Retreives daily unique wallets statistics.'
              #swagger.tags = ['MAW']
              #swagger.parameters['network'] = {
                  in: 'path',
                  description: 'The network name. Supported networks: astar',
                  required: true,
                  enum: ['astar']
              }
              #swagger.parameters['period'] = {
                    in: 'path',
                    description: 'The period type.  Supported values: 7 days, 30 days',
                    required: true,
                    enum: ['7 days', '30 days']
                }
          */

            try {
                const network = req.params.network as NetworkType;
                const period = req.params.period as PeriodType;
                const data = await this._mawService.getUniqueWalletsCount(period, network);
                res.json(data);
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        app.route('/api/v1/:network/maw/monthly/:numberOfMonths').get(async (req: Request, res: Response) => {
            /*
            #swagger.description = 'Retreives monthly wallets statistics in CSV format'
            #swagger.tags = ['MAW']
            #swagger.parameters['network'] = {
                in: 'path',
                description: 'The network name. Supported networks: astar',
                required: true,
                enum: ['astar']
            }
            #swagger.parameters['numberOfMonths'] = {
                in: 'path',
                description: 'Max. number of months to retrieve (greater than 0)',
                required: true,
            }
        */

            try {
                const network = req.params.network as NetworkType;
                const numberOfMonths = Number(req.params.numberOfMonths);
                const data = await this._mawService.getMonthlyData(numberOfMonths, network);

                // Generate and return CSV
                const csv = this.generateCsv(data);
                res.header('Content-Type', 'text/csv');
                res.attachment('monthly.csv');

                return res.send(csv);
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });
    }

    private generateCsv(data: UsersCount[]): string {
        let csv = 'Date, NativeActiveUsersCount, EVMActiveUsersCount\n';
        data.map((item) => {
            csv += `${item.id}, ${item.nativeActiveUsers.length}, ${item.evmActiveUsers.length}` + '\n';
        });

        return csv;
    }
}
