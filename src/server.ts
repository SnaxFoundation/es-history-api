import { createExpressLogger } from '@snaxfoundation/snax-pino-logger';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { config } from './config';
import logger from './logger';
import router from './routes';

const expressLogger = createExpressLogger({
  logger,
});

const app = express();

app.use(expressLogger);
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use(compression());

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
  } else {
    next();
  }
});

app.use((req, res, next) => {
  if (typeof req.body === 'string') {
    req.body = JSON.parse(req.body);
  }

  next();
});

app.use(router);

app.listen(config.server.port, () => {
  logger.info(`Listening ${config.server.host}:${config.server.port}`);
});
