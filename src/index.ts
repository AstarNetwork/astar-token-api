import express from 'express';
import cors from 'cors';
// import { uiRouter } from './routes/ui';
// import { storeRouter } from './routes/store';
// import { validationRouter } from './routes/validate';
// import { connectApi } from './polkadot';

const listenPort = process.env.PORT || 30000;
const app = express();
app.use(cors());

app.use(express.json({ limit: '2mb' }));
// app.use(
//   express.urlencoded({
//     extended: true,
//   }),
// );

// app.use('/api/store', storeRouter);
// app.use('/api/validate', validationRouter);
// app.use('/', uiRouter);

// connectApi();

app.listen(listenPort, () => {
    console.log('Server is listening on port ', listenPort);
});
