// Import required by Inversify IoC, otherwise 'Reflect.hasOwnMetadata is not a function' exception is thrown
// during types resolution.
import 'reflect-metadata';

import { Container } from 'inversify';
import { IControllerBase } from './controllers/IControllerBase';
import { TokenStatsController } from './controllers/TokenStatsController';
import { IStatsService, StatsService } from './services/StatsService';
import { AstarApi, IAstarApi } from './client/AstarApi';

export const ContainerTypes = {
    Controller: 'Controller',
    StatsService: 'StatsService',
};

const container = new Container();

// data access
container.bind<IAstarApi>('api').to(AstarApi).inSingletonScope();

// services registration
container.bind<IStatsService>('StatsService').to(StatsService).inSingletonScope();

// controllers registration
container.bind<IControllerBase>(ContainerTypes.Controller).to(TokenStatsController);

export default container;
