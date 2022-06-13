import express from 'express';
import cors from 'cors';
// import swagger from 'swagger-ui-express';
import * as functions from 'firebase-functions';
import container, { ContainerTypes } from './container';
import { IControllerBase } from './controllers/IControllerBase';
// import swaggerFile from './swagger_output.json';

const app = express();
app.use(cors());

// Get all controllers and register all endpoints.
const controllers: IControllerBase[] = container.getAll<IControllerBase>(ContainerTypes.Controller);
controllers.forEach((controller) => controller.register(app));

// app.use('/', swagger.serve, swagger.setup(swaggerFile));

exports.app = functions.https.onRequest(app);
