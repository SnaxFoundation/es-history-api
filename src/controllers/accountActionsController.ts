import { Request, Response } from 'express';
import elastic from '../lib/elastic';
import logger from '../logger';

export class AccountActionsController {
  public getActions = async (req: Request, res: Response) => {
    const { body } = req;

    logger
      .child({ accountActionsRequest: body })
      .debug('Account actions request');

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

      const result = {
        actions: data,
        total: elasticResponse.hits.total,
      };

      res.send(result);
    } catch (error) {
      logger
        .child({
          accountActionsError: { errorMessage: JSON.stringify(error), ...body },
        })
        .error('Account actions error');
      res.status(500).send(error);
    }
  };

  private createQuery({ account_name, pos = -1, offset = -20 }) {
    const order = offset >= 0 ? 'asc' : 'desc';
    const size = Math.abs(offset);

    const query: any = {
      index: 'action_traces',
      body: {
        sort: [
          {
            block_time: {
              order,
            },
          },
        ],
        size,
        query: {
          bool: {
            must: [
              {
                bool: {
                  should: [
                    {
                      
                        path: 'act',
                        query: {
                          nested: {
                            path: 'act.authorization',
                            query: {
                              bool: {
                                must: [
                                  {
                                    match: {
                                      'act.authorization.actor': account_name,
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        },
     
                    },
                    {
                      nested: {
                        path: 'receipt',
                        query: {
                          bool: {
                            must: [
                              {
                                match: {
                                  'receipt.receiver': account_name,
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    };

    if (pos !== -1 && offset < 0) {
      query.body.query.bool.must.push({
        bool: {
          must: [
            {
              nested: {
                path: 'receipt',
                query: {
                  range: {
                    'receipt.global_sequence': {
                      lt: pos,
                    },
                  },
                },
              },
            },
          ],
        },
      });
    }

    if (pos !== -1 && offset > 0) {
      query.body.query.bool.must.push({
        bool: {
          must: [
            {
              nested: {
                path: 'receipt',
                query: {
                  range: {
                    'receipt.global_sequence': {
                      gt: pos,
                    },
                  },
                },
              },
            },
          ],
        },
      });
    }

    return query;
  }
}
