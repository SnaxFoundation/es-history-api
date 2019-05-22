import * as bodybuilder from 'bodybuilder';
import { Request, Response } from 'express';
import elastic from '../lib/elastic';
import logger from '../logger';

export class RewardController {
  public getRewardsByAccount = async (req: Request, res: Response) => {
    const { body } = req;

    logger
      .child({ accountRewardsRequest: body })
      .debug('Account rewards request');

    if (!body.account_name) {
      return res.status(500).send('account_name is required');
    }

    if (body.offset && !Number(body.offset)) {
      return res.status(500).send('offset should be a number');
    }

    if (body.pos && !Number(body.pos)) {
      return res.status(500).send('pos should be a number');
    }

    const query: any = this.createQuery(body);

    try {
      const elasticResponse = await elastic.search(query);

      const data = elasticResponse.hits.hits.map(item => {
        const source: any = item._source;
        source.act.data = JSON.parse(source.act.data);

        return {
          block_num: source.block_num,
          block_time: source.block_time,
          action_trace: source,
        };
      });

      const hasMore = data.length < elasticResponse.hits.total;

      const result = {
        actions: data,
        total: data.length,
        hasMore,
      };

      res.send(result);
    } catch (error) {
      logger
        .child({
          accountRewardError: {
            errorMessage: JSON.stringify(error),
            ...body,
          },
        })
        .debug('Account rewards error');
      res.status(500).send(error);
    }
  };

  private createQuery({ platform, account_name, pos = -1, offset = -20 }) {
    const order = offset >= 0 ? 'asc' : 'desc';
    const size = Math.abs(offset);

    const query = bodybuilder()
      .size(size)
      .sort('block_time', order)
      .query('bool', q => {
        if (pos !== -1 && offset < 0) {
          q = q.query('nested', { path: 'receipt' }, q => {
            return q.query('range', 'receipt.global_sequence', { lt: pos });
          });
        }

        if (pos !== -1 && offset > 0) {
          q = q.query('nested', { path: 'receipt' }, q => {
            return q.query('range', 'receipt.global_sequence', { gt: pos });
          });
        }

        q = q.query('bool', q => {
          if (platform) {
            Object.keys(platform).forEach(platformId => {
              q = q.orQuery('nested', { path: 'act' }, q => {
                return q
                  .query('match_phrase', 'act.data', `"to": ${account_name}`)
                  .query('match', 'act.name', 'transfer')
                  .query('match_phrase', 'act.data', `"from": ${platformId}`)
                  .query('nested', { path: 'receipt' }, q => {
                    return q.query('match', 'receipt.receiver', account_name);
                  });
              });
            });
          }

          return q;
        });

        return q;
      });

    return {
      index: 'action_traces',
      body: query.build(),
    };
  }
}
