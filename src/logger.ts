import { createLogger } from '@snaxfoundation/snax-pino-logger';

const logger = createLogger({
  name: 'es-history-api',
  prettyPrint: process.env.LOG_PRETTY || false,
  level: process.env.LOG_LEVEL || 'debug',
});

export default logger;
