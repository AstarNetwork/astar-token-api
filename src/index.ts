import express from 'express';
import cors from 'cors';
import swagger from 'swagger-ui-express';
import container, { ContainerTypes } from './container';
import { IControllerBase } from './controllers/IControllerBase';
import swaggerFile from '../swagger_output.json';
import { generateDocumentation } from './swagger';

const listenPort = process.env.PORT || 30000;
const app = express();
app.use(cors());

// Get all controllers and register all endpoints.
const controllers: IControllerBase[] = container.getAll<IControllerBase>(ContainerTypes.Controller);
controllers.forEach((controller) => controller.register(app));

app.use('/', swagger.serve, swagger.setup(swaggerFile));
app.listen(listenPort, () => {
    console.log('Server is listening on port ', listenPort);
});
