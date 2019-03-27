import { Response } from 'express';
import elastic from '../lib/elastic';

export class HealthController {
  public responseOk(_, res: Response) {
    res.status(200);
    res.end();
  }

  public async checkElastic(_, res: Response) {
    try {
      await elastic.ping({
        requestTimeout: 1000,
      });
      res.status(200);
      res.end();
    } catch (error) {
      res.send(error);
    }
  }
}
