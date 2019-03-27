import * as elasticsearch from 'elasticsearch';
import { config } from '../config';

const client = new elasticsearch.Client({
  host: [
    {
      host: config.elastic.host,
      port: config.elastic.port,
      protocol: config.elastic.protocol,
    },
  ],
});

export default client;
