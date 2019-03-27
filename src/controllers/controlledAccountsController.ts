import * as bodybuilder from 'bodybuilder';
import { Request, Response } from 'express';

import elastic from '../lib/elastic';

export class ControlledAccountsController {
  public getControlledAccounts = async (req: Request, res: Response) => {
    const { body } = req;

    if (!body.controlling_account) {
      res.status(500).send('controlling_account is required');
      return;
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
