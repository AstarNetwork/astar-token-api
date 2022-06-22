import express from 'express';
import bodyParser from 'body-parser';
import * as functions from 'firebase-functions';
import cors from 'cors';
import container, { ContainerTypes } from './container';
import { IControllerBase } from './controllers/IControllerBase';

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Get all controllers and register all endpoints.
const controllers: IControllerBase[] = container.getAll<IControllerBase>(ContainerTypes.Controller);
controllers.forEach((controller) => controller.register(app));

exports.app = functions.https.onRequest(app);
