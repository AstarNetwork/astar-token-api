// Fix for breaking change introduced in polkadot js v7.x
// https://polkadot.js.org/docs/api/FAQ/#since-upgrading-to-the-7x-series-typescript-augmentation-is-missing
import '@polkadot/api-augment';
// Fix end
import express from 'express';
import bodyParser from 'body-parser';
import * as functions from 'firebase-functions';
import * as fs from 'fs';
import cors from 'cors';
import container from './container';
import { IControllerBase } from './controllers/IControllerBase';
import { ContainerTypes } from './containertypes';
import { IDappRadarService } from './services/DappRadarService';
import { NetworkType } from './networks';

console.log('Fetching dapps ddd');
const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Get all controllers and register all endpoints.
const controllers: IControllerBase[] = container.getAll<IControllerBase>(ContainerTypes.Controller);
controllers.forEach((controller) => controller.register(app));

exports.app = functions.https.onRequest(app);

// Define and start DappRadar dapps fetching periodic task.
// const DAPP_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// async function getDappRadarDapps(network: NetworkType) {
//     const radarService = container.get<IDappRadarService>(ContainerTypes.DappRadarService);
//     console.log(`Fetching dapps for ${network}`);
//     try {
//         const dapps = await radarService.getDapps('astar');
//         fs.writeFileSync(`${network}_dapps.json`, JSON.stringify(dapps));

//         console.log(await radarService.getDappTransactionsHistory('tofuNFT', 'url', network));
//     } catch (err) {
//         functions.logger.error(err);
//     }
// }

// async function startDappPeriodicCheck() {
//     setInterval(async () => {
//         await getDappRadarDapps('astar');
//         await getDappRadarDapps('shiden');
//     }, DAPP_CHECK_INTERVAL_MS);
// }

// getDappRadarDapps('astar');
// getDappRadarDapps('shiden');
// startDappPeriodicCheck();

// async function getStats(): Promise<void> {
//     const radarService = container.get<IDappRadarService>(ContainerTypes.DappRadarService);
//     const stats = await radarService.getDappTransactionsHistory('tofuNFT', 'na', 'astar');
// }

// getStats();
