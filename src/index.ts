// Fix for breaking change introduced in polkadot js v7.x
// https://polkadot.js.org/docs/api/FAQ/#since-upgrading-to-the-7x-series-typescript-augmentation-is-missing
import '@polkadot/api-augment';
// Fix end
import express from 'express';
import bodyParser from 'body-parser';
import * as functions from 'firebase-functions';
import cors from 'cors';
import container from './container';
import { IControllerBase } from './controllers/IControllerBase';
import { ContainerTypes } from './containertypes';
import { IDappsStakingService } from './services/DappsStakingService';
import { DappsStakingService2 } from './services/DappsStakingService2';
import { networks } from './networks';

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Having this registrations in container.ts makes Jest to fail to run tests with 'Jest encountered an unexpected token' error.
container
    .bind<IDappsStakingService>(ContainerTypes.DappsStakingService)
    .to(DappsStakingService2)
    .inSingletonScope()
    .whenTargetNamed(networks.shibuya.name);
container
    .bind<IDappsStakingService>(ContainerTypes.DappsStakingService)
    .to(DappsStakingService2)
    .inSingletonScope()
    .whenTargetNamed(networks.development.name);

// Get all controllers and register all endpoints.
const controllers: IControllerBase[] = container.getAll<IControllerBase>(ContainerTypes.Controller);
controllers.forEach((controller) => controller.register(app));

exports.app = functions.https.onRequest(app);
