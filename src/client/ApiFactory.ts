import { injectable } from 'inversify';
import container from '../container';
import { ContainerTypes } from '../containertypes';
import { networks, NetworkType } from '../networks';
import { IAstarApi } from './BaseApi';

export interface IApiFactory {
    getApiInstance(networkName: string): IAstarApi;
}

@injectable()
export class ApiFactory implements IApiFactory {
    public getApiInstance(networkName: NetworkType): IAstarApi {
        try {
            return container.getNamed<IAstarApi>(ContainerTypes.Api, networkName);
        } catch {
            // fallback to Astar if invalid network name provided
            console.warn(`IAstarApi container for ${networkName} network not found. Falling back to Astar`);
            return container.getNamed<IAstarApi>(ContainerTypes.Api, networks.astar.name);
        }
    }
}
