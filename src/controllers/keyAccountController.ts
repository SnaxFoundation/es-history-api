import * as bodybuilder from 'bodybuilder';
import { Request, Response } from 'express';
import logger from '../logger';

import elastic from '../lib/elastic';

export class KeyAccountController {
  public getAccountsByPublicKey = async (req: Request, res: Response) => {
    const { body } = req;

    logger.child({ keyAccountRequest: body }).debug('Key accounts request');

    if (!body.public_key) {
      return res.status(500).send('public_key is required');
    }

    const query: any = this.createQuery(body);

    try {
      const elasticResponse = await elastic.search(query);

      const data = elasticResponse.hits.hits.map(item => {
        const source: any = item._source;
        return source.name;
      });

      const result = {
        account_names: data,
      };

      res.send(result);
    } catch (error) {
      logger
        .child({
          keyAccountError: {
            errorMessage: JSON.stringify(error),
            ...body,
          },
        })
        .error('Key accounts error');
      res.status(500).send(error);
    }
  };

  private createQuery({ public_key }) {
    const body = bodybuilder().query('nested', { path: 'pub_keys' }, q => {
      return q.query('match', 'pub_keys.key', public_key);
    });

    return {
      index: 'accounts',
      size: 100,
      body: body.build(),
    };
  }
}
