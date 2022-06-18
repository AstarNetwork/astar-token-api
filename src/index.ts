import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import swagger from 'swagger-ui-express';
import container, { ContainerTypes } from './container';
import { IControllerBase } from './controllers/IControllerBase';
import { blockInterval, harvest } from './services/GasService';
import swaggerFile from './swagger_output.json';

const listenPort = process.env.PORT || 3000;
const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Get all controllers and register all endpoints.
const controllers: IControllerBase[] = container.getAll<IControllerBase>(ContainerTypes.Controller);
controllers.forEach((controller) => controller.register(app));

app.use('/', swagger.serve, swagger.setup(swaggerFile));
app.listen(listenPort, () => {
    console.log('Server is listening on port ', listenPort);
    harvest('shibuya');
    harvest('shiden');
    harvest('astar');
    setInterval(() => {
        harvest('shibuya');
        harvest('shiden');
        harvest('astar');
    }, blockInterval);
});
