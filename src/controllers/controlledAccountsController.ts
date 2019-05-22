import * as bodybuilder from 'bodybuilder';
import { Request, Response } from 'express';
import logger from '../logger';

import elastic from '../lib/elastic';

export class ControlledAccountsController {
  public getControlledAccounts = async (req: Request, res: Response) => {
    const { body } = req;

    logger
      .child({ controlledAccountsRequest: body })
      .debug('Controlled accounts request');

    if (!body.controlling_account) {
      return res.status(500).send('controlling_account is required');
    }

    const query: any = this.createQuery(body);

    try {
      const elasticResponse = await elastic.search(query);

      const data = elasticResponse.hits.hits.map(item => {
        const source: any = item._source;
        return source.name;
      });

      const result = {
        controlled_accounts: data,
      };

      res.send(result);
    } catch (error) {
      logger
        .child({
          controlledAccountsError: {
            errorMessage: JSON.stringify(error),
            ...body,
          },
        })
        .error('Controlled accounts error');
      res.status(500).send(error);
    }
  };

  private createQuery({ controlling_account }) {
    const body = bodybuilder().query(
      'nested',
      { path: 'account_controls' },
      q => {
        return q.query('match', 'account_controls.name', controlling_account);
      }
    );

    return {
      index: 'accounts',
      size: 100,
      body: body.build(),
    };
  }
}
