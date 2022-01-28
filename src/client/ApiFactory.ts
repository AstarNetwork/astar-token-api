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
        try {
            return container.getNamed<IAstarApi>('api', networkName);
        } catch {
            // fallback to Astar if invalid network name provided
            return container.getNamed<IAstarApi>('api', networks.astar.name);
        }
    }
}
