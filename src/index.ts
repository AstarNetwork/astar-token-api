import express from 'express';
import * as functions from 'firebase-functions';
import cors from 'cors';
import container, { ContainerTypes } from './container';
import { IControllerBase } from './controllers/IControllerBase';

const app = express();
app.use(cors());

// Get all controllers and register all endpoints.
const controllers: IControllerBase[] = container.getAll<IControllerBase>(ContainerTypes.Controller);
controllers.forEach((controller) => controller.register(app));

exports.app = functions.https.onRequest(app);
