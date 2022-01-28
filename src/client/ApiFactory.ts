import { injectable } from 'inversify';
import container from '../container';
import { networks } from '../networks';
import { IAstarApi } from './AstarApi';

export interface IApiFactory {
    getApiInstance(networkName: string): IAstarApi;
}

@injectable()
export class ApiFactory implements IApiFactory {
    public getApiInstance(networkName: string): IAstarApi {
        let name = networks.astar.name;

        if (networkName === networks.shiden.name) {
            name = networks.shiden.name;
        }

        return container.getNamed<IAstarApi>('api', name);
    }
}
