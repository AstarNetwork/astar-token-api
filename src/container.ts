// Import required by Inversify IoC, otherwise 'Reflect.hasOwnMetadata is not a function' exception is thrown
// during types resolution.
// `import 'reflect-metadata'` must be in the top of this file
import 'reflect-metadata';

import { Container } from 'inversify';
import { IControllerBase } from './controllers/IControllerBase';
import { TokenStatsController } from './controllers/TokenStatsController';
import { IStatsService, StatsService } from './services/StatsService';
import { ITxQueryService, TxQueryService } from './services/TxQueryService';
import { SubscanService, ISubscanService } from './services/SubscanService';
import { TxQueryController } from './controllers/TxQueryController';
import { IAstarApi } from './client/BaseApi';
import { networks } from './networks';
import { ApiFactory, IApiFactory } from './client/ApiFactory';
import { DappsStakingController } from './controllers/DappsStakingController';
import { IDappsStakingService, DappsStakingService } from './services/DappsStakingService';
import { IStatsIndexerService, StatsIndexerService } from './services/StatsIndexerService';
import { NodeController } from './controllers/NodeController';
import { AstarApi2 } from './client/AstarApi2';
import { FirebaseService, IFirebaseService } from './services/FirebaseService';
import { ContainerTypes } from './containertypes';
import { IPriceProvider } from './services/IPriceProvider';
import { DiaDataPriceProvider } from './services/DiaDataPriceProvider';
import { CoinGeckoPriceProvider } from './services/CoinGeckoPriceProvider';
import { PriceProviderWithFailover } from './services/PriceProviderWithFailover';

const container = new Container();

// data access
container
    .bind<IAstarApi>(ContainerTypes.Api)
    .toConstantValue(new AstarApi2(networks.shiden.endpoints))
    .whenTargetNamed(networks.shiden.name);
container
    .bind<IAstarApi>(ContainerTypes.Api)
    .toConstantValue(new AstarApi2(networks.astar.endpoints))
    .whenTargetNamed(networks.astar.name);
container
    .bind<IAstarApi>(ContainerTypes.Api)
    .toConstantValue(new AstarApi2(networks.shibuya.endpoints))
    .whenTargetNamed(networks.shibuya.name);
container
    .bind<IAstarApi>(ContainerTypes.Api)
    .toConstantValue(new AstarApi2(networks.development.endpoints))
    .whenTargetNamed(networks.development.name);
container.bind<IApiFactory>(ContainerTypes.ApiFactory).to(ApiFactory).inSingletonScope();

// services registration
container.bind<IStatsService>(ContainerTypes.StatsService).to(StatsService).inSingletonScope();
container.bind<ITxQueryService>(ContainerTypes.TxQueryService).to(TxQueryService).inSingletonScope();
container.bind<IDappsStakingService>(ContainerTypes.DappsStakingService).to(DappsStakingService).inSingletonScope();
container.bind<IStatsIndexerService>(ContainerTypes.StatsIndexerService).to(StatsIndexerService).inSingletonScope();
container.bind<IFirebaseService>(ContainerTypes.FirebaseService).to(FirebaseService).inSingletonScope();
container.bind<IPriceProvider>(ContainerTypes.PriceProvider).to(DiaDataPriceProvider).inSingletonScope();
container.bind<IPriceProvider>(ContainerTypes.PriceProvider).to(CoinGeckoPriceProvider).inSingletonScope();
container
    .bind<IPriceProvider>(ContainerTypes.PriceProviderWithFailover)
    .to(PriceProviderWithFailover)
    .inSingletonScope();
container.bind<ISubscanService>(ContainerTypes.SubscanService).to(SubscanService).inSingletonScope();

// controllers registration
container.bind<IControllerBase>(ContainerTypes.Controller).to(TokenStatsController);
container.bind<IControllerBase>(ContainerTypes.Controller).to(DappsStakingController);
container.bind<IControllerBase>(ContainerTypes.Controller).to(NodeController);
container.bind<IControllerBase>(ContainerTypes.Controller).to(TxQueryController);

export default container;
