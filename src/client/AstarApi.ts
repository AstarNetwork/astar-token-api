import { BaseApi, IAstarApi } from './BaseApi';
import { networks } from '../networks';

export class AstarApi extends BaseApi implements IAstarApi {
    constructor(endpoints = networks.astar.endpoints) {
        super(endpoints);
    }
}
