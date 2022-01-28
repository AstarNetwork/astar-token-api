import express from 'express';
import cors from 'cors';
import container, { ContainerTypes } from './container';
import { IControllerBase } from './controllers/IControllerBase';

const listenPort = process.env.PORT || 30000;
const app = express();
app.use(cors());

// app.use(express.json({ limit: '2mb' }));
// app.use(
//   express.urlencoded({
//     extended: true,
//   }),
// );

// app.use('/api/store', storeRouter);
// app.use('/api/validate', validationRouter);
// app.use('/', uiRouter);

// connectApi();

// Get all controllers and register all endpoints.
const controllers: IControllerBase[] = container.getAll<IControllerBase>(ContainerTypes.Controller);
controllers.forEach((controller) => controller.register(app));

app.listen(listenPort, () => {
    console.log('Server is listening on port ', listenPort);
});
