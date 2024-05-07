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
import { DappsStakingV3Controller } from './controllers/DappsStakingV3Controller';
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
import { DappsStakingService2 } from './services/DappsStakingService2';
import { DappsStakingEvents, IDappsStakingEvents } from './services/DappsStakingEvents';
import { IMonthlyActiveWalletsService, MonthlyActiveWalletsService } from './services/MonthlyActiveWalletsService';
import { MonthlyActiveWalletsController } from './controllers/MonthlyActiveWalletsController';
import { DappsStakingStatsService, IDappsStakingStatsService } from './services/DappsStakingStatsService';
import { IDappRadarService, DappRadarService } from './services/DappRadarService';
import { GiantSquidService, IGiantSquidService } from './services/GiantSquidService';
import {
    BatchCallParser,
    BondAndStakeParser,
    CallNameMapping,
    ICallParser,
    NominationTransferParser,
    UnbondAndUnstakeParser,
    WithdrawFromUnbondedParser,
    WithdrawParser,
} from './services/GiantSquid';
import { BluezNftService, INftService } from './services/NftService';
import { NftController } from './controllers/NftController';
import { TokenStatsControllerV2 } from './controllers/TokenStatsControllerV2';

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
    .toConstantValue(new AstarApi2(networks.rocstar.endpoints))
    .whenTargetNamed(networks.rocstar.name);
container
    .bind<IAstarApi>(ContainerTypes.Api)
    .toConstantValue(new AstarApi2(networks.development.endpoints))
    .whenTargetNamed(networks.development.name);
container.bind<IApiFactory>(ContainerTypes.ApiFactory).to(ApiFactory).inSingletonScope();

// services registration
container.bind<IStatsService>(ContainerTypes.StatsService).to(StatsService).inSingletonScope();

container.bind<IDappsStakingEvents>(ContainerTypes.DappsStakingEvents).to(DappsStakingEvents).inSingletonScope();

container
    .bind<IDappsStakingService>(ContainerTypes.DappsStakingService)
    .to(DappsStakingService2)
    .inSingletonScope()
    .whenTargetNamed(networks.astar.name);
container
    .bind<IDappsStakingService>(ContainerTypes.DappsStakingService)
    .to(DappsStakingService2)
    .inSingletonScope()
    .whenTargetNamed(networks.shiden.name);
container
    .bind<IDappsStakingService>(ContainerTypes.DappsStakingService)
    .to(DappsStakingService2)
    .inSingletonScope()
    .whenTargetNamed(networks.shibuya.name);
container
    .bind<IDappsStakingService>(ContainerTypes.DappsStakingService)
    .to(DappsStakingService2)
    .inSingletonScope()
    .whenTargetNamed(networks.rocstar.name);
container
    .bind<IDappsStakingService>(ContainerTypes.DappsStakingService)
    .to(DappsStakingService2)
    .inSingletonScope()
    .whenTargetNamed(networks.development.name);

container.bind<IStatsIndexerService>(ContainerTypes.StatsIndexerService).to(StatsIndexerService).inSingletonScope();
container.bind<IFirebaseService>(ContainerTypes.FirebaseService).to(FirebaseService).inSingletonScope();
// Disabled because results from DIA are not reliable
//container.bind<IPriceProvider>(ContainerTypes.PriceProvider).to(DiaDataPriceProvider).inSingletonScope();
container.bind<IPriceProvider>(ContainerTypes.PriceProvider).to(CoinGeckoPriceProvider).inSingletonScope();
container
    .bind<IPriceProvider>(ContainerTypes.PriceProviderWithFailover)
    .to(PriceProviderWithFailover)
    .inSingletonScope();
container.bind<ISubscanService>(ContainerTypes.SubscanService).to(SubscanService).inSingletonScope();
container.bind<ITxQueryService>(ContainerTypes.TxQueryService).to(TxQueryService).inSingletonScope();
container
    .bind<IMonthlyActiveWalletsService>(ContainerTypes.MonthlyActiveWalletsService)
    .to(MonthlyActiveWalletsService)
    .inSingletonScope();
container
    .bind<IDappsStakingStatsService>(ContainerTypes.DappsStakingStatsService)
    .to(DappsStakingStatsService)
    .inRequestScope();
container.bind<IDappRadarService>(ContainerTypes.DappRadarService).to(DappRadarService).inRequestScope();
container.bind<IGiantSquidService>(ContainerTypes.GiantSquidService).to(GiantSquidService).inRequestScope();
container.bind<INftService>(ContainerTypes.BluezNftService).to(BluezNftService).inRequestScope();

// Giant squid parsers
container.bind<ICallParser>(CallNameMapping.bond_and_stake).to(BondAndStakeParser).inSingletonScope();
container.bind<ICallParser>(CallNameMapping.unbond_and_unstake).to(UnbondAndUnstakeParser).inSingletonScope();
container.bind<ICallParser>(CallNameMapping.nomination_transfer).to(NominationTransferParser).inSingletonScope();
container.bind<ICallParser>(CallNameMapping.withdraw_unbonded).to(WithdrawParser).inSingletonScope();
container
    .bind<ICallParser>(CallNameMapping.withdraw_from_unregistered)
    .to(WithdrawFromUnbondedParser)
    .inSingletonScope();
container.bind<ICallParser>(CallNameMapping.batch).to(BatchCallParser).inSingletonScope();

// controllers registration
container.bind<IControllerBase>(ContainerTypes.Controller).to(TokenStatsController);
container.bind<IControllerBase>(ContainerTypes.Controller).to(TokenStatsControllerV2);
container.bind<IControllerBase>(ContainerTypes.Controller).to(DappsStakingController);
container.bind<IControllerBase>(ContainerTypes.Controller).to(DappsStakingV3Controller);
container.bind<IControllerBase>(ContainerTypes.Controller).to(NodeController);
container.bind<IControllerBase>(ContainerTypes.Controller).to(TxQueryController);
container.bind<IControllerBase>(ContainerTypes.Controller).to(MonthlyActiveWalletsController);
container.bind<IControllerBase>(ContainerTypes.Controller).to(NftController);

export default container;
