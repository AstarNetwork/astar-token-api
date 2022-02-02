import { injectable } from 'inversify';
import container from '../container';
import { networks, NetworkType } from '../networks';
import { IAstarApi } from './AstarApi';

export interface IApiFactory {
    getApiInstance(networkName: string): IAstarApi;
}

@injectable()
export class ApiFactory implements IApiFactory {
    public getApiInstance(networkName: NetworkType): IAstarApi {
        try {
            return container.getNamed<IAstarApi>('api', networkName);
        } catch {
            // fallback to Astar if invalid network name provided
            console.warn(`IAstarApi container for ${networkName} network not found. Falling back to Astar`);
            return container.getNamed<IAstarApi>('api', networks.astar.name);
        }
    }
}
