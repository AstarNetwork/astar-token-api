// Import required by Inversify IoC, otherwise 'Reflect.hasOwnMetadata is not a function' exception is thrown
// during types resolution.
import 'reflect-metadata';

import { Container } from 'inversify';
import { IControllerBase } from './controllers/IControllerBase';
import { TokenStatsController } from './controllers/TokenStatsController';
import { IStatsService, StatsService } from './services/StatsService';
import { AstarApi } from './client/AstarApi';
import { IAstarApi } from './client/BaseApi';
import { networks } from './networks';
import { ApiFactory, IApiFactory } from './client/ApiFactory';
import { DappsStakingController } from './controllers/DappsStakingController';
import { IDappsStakingService, DappsStakingService } from './services/DappsStakingService';
import { IGasService, GasService } from './services/GasService';
import { GasController } from './controllers/GasController';
import { IStatsIndexerService, StatsIndexerService } from './services/StatsIndexerService';
import { NodeController } from './controllers/NodeController';
import { AstarApi2 } from './client/AstarApi2';
import { FirebaseService, IFirebaseService } from './services/FirebaseService';

export const ContainerTypes = {
    Controller: 'Controller',
    StatsService: 'StatsService',
};

const container = new Container();

// data access
container
    .bind<IAstarApi>('api')
    .toConstantValue(new AstarApi2(networks.shiden.endpoint))
    .whenTargetNamed(networks.shiden.name);
container
    .bind<IAstarApi>('api')
    .toConstantValue(new AstarApi2(networks.astar.endpoint))
    .whenTargetNamed(networks.astar.name);
container
    .bind<IAstarApi>('api')
    .toConstantValue(new AstarApi2(networks.shibuya.endpoint))
    .whenTargetNamed(networks.shibuya.name);
container.bind<IApiFactory>('factory').to(ApiFactory).inSingletonScope();

// services registration
container.bind<IStatsService>('StatsService').to(StatsService).inSingletonScope();
container.bind<IDappsStakingService>('DappsStakingService').to(DappsStakingService).inSingletonScope();
container.bind<IStatsIndexerService>('StatsIndexerService').to(StatsIndexerService).inSingletonScope();
container.bind<IGasService>('GasService').to(GasService).inSingletonScope();
container.bind<IFirebaseService>('FirebaseService').to(FirebaseService).inSingletonScope();

// controllers registration
container.bind<IControllerBase>(ContainerTypes.Controller).to(TokenStatsController);
container.bind<IControllerBase>(ContainerTypes.Controller).to(DappsStakingController);
container.bind<IControllerBase>(ContainerTypes.Controller).to(NodeController);
container.bind<IControllerBase>(ContainerTypes.Controller).to(GasController);

export default container;
