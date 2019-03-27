import * as bodybuilder from 'bodybuilder';
import { Request, Response } from 'express';

import elastic from '../lib/elastic';

export class TransactionController {
  public getTransaction = async (req: Request, res: Response) => {
    const { body } = req;

    if (!body.id) {
      res.status(500).send('id is required');
      return;
    }

    const query: any = this.createQuery(body);

    try {
      const elasticResponse = await elastic.search(query);

      if (!elasticResponse.hits.hits) {
        res.status(500).send('Invalid transaction ID');
        return;
      }

      const source: any = elasticResponse.hits.hits[0]._source;

      const data = {
        id: source.id,
        block_time: source.block_time,
        block_num: source.block_num,
        traces: source.action_traces,
        trx: {
          receipt: source.receipt,
        },
      };

      res.send(data);
    } catch (error) {
      res.status(500).send(error);
    }
  };

  private createQuery({ id }) {
    const body = bodybuilder().query('match', 'id', id);

    return {
      index: 'transaction_traces',
      size: 1,
      body: body.build(),
    };
  }
}
