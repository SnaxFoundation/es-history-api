import * as bodybuilder from 'bodybuilder';
import { Request, Response } from 'express';
import { config } from '../config';
import elastic from '../lib/elastic';
import logger from '../logger';

export class TransactionByAccountController {
  public getActions = async (req: Request, res: Response) => {
    const { body } = req;

    logger
      .child({ transactionsByAccountRequest: body })
      .debug('Transactions by account request');

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

      // as soon as the only only way to distinguish social trx and snax trx is memo
      // and we can't use it. We should manually remove dublicates

      const maybeDuplicateTrxIds = new Set();

      const finalData = data.filter(trxDoc => {
        if (trxDoc.action_trace.receipt.receiver !== 'snax') {
          if (!maybeDuplicateTrxIds.has(trxDoc.action_trace.trx_id)) {
            maybeDuplicateTrxIds.add(trxDoc.action_trace.trx_id);
            return true;
          }
        }
      });

      const result = {
        actions: finalData,
        total: finalData.length,
        hasMore,
      };

      res.send(result);
    } catch (error) {
      logger
        .child({
          transactionsByAccountError: {
            errorMessage: JSON.stringify(error),
            ...body,
          },
        })
        .debug('Transactions by account error');

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
              const userId = platform[platformId].id;

              q = q.orQuery('nested', { path: 'act' }, q => {
                return q
                  .query('match_phrase', 'act.data', `"to": ${userId}`)
                  .query('match', 'act.name', 'transfersoc')
                  .query('match', 'act.account', platformId);
              });

              q = q.orQuery('nested', { path: 'act' }, q => {
                return q
                  .query('match_phrase', 'act.data', `"from": ${account_name}`)
                  .query('match', 'act.name', 'transfersoc')
                  .query('match', 'act.account', platformId);
              });
            });
          }

          q.orQuery('bool', q => {
            return q
              .query('nested', { path: 'act' }, q => {
                return q
                  .query('match', 'act.name', 'transfer')
                  .query('nested', { path: 'act.authorization' }, q => {
                    return q.query(
                      'match',
                      'act.authorization.actor',
                      account_name
                    );
                  })
                  .notQuery('match_phrase', 'act.data', '"to": "snax.transf"');
              })
              .query('nested', { path: 'receipt' }, q => {
                return q.query('match', 'receipt.receiver', account_name);
              });
          });

          q = q.orQuery('bool', q => {
            return q
              .query('nested', { path: 'receipt' }, q => {
                return q.query('match', 'receipt.receiver', account_name);
              })
              .query('nested', { path: 'act' }, q => {
                return q.notQuery(
                  'match_phrase',
                  'act.data',
                  '"to": "snax.transf"'
                );
              });
          });

          q.orQuery('nested', { path: 'act' }, q => {
            return q
              .notQuery('match', 'act.account', 'snax.token')
              .query('nested', { path: 'act.authorization' }, q => {
                return q.query(
                  'match',
                  'act.authorization.actor',
                  account_name
                );
              })
              .query('match_phrase', 'act.data', `"from": ${account_name}`)
              .notQuery('match_phrase', 'act.data', '"to": "snax.transf"');
          });

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
