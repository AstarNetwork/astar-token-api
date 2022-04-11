import { BaseApi, IAstarApi } from './BaseApi';
import { networks } from '../networks';

export class AstarApi extends BaseApi implements IAstarApi {
    constructor(endpoint = networks.astar.endpoint) {
        super(endpoint);
    }
}
