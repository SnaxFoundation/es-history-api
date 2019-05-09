import * as express from 'express';

import {
  AccountActionsController,
  ControlledAccountsController,
  HealthController,
  KeyAccountController,
  PlatformTransactionByAccountController,
  RewardController,
  TransactionByAccountController,
  TransactionController,
} from '../controllers';

const healthController = new HealthController();
const controlledAccountsController = new ControlledAccountsController();
const accountActionsController = new AccountActionsController();
const transactionsController = new TransactionController();
const platformTransactionByAccountController = new PlatformTransactionByAccountController();
const transactionByAccountController = new TransactionByAccountController();
const keyAccountController = new KeyAccountController();
const rewardController = new RewardController();

const router = express.Router();

router.get('/health', healthController.responseOk);
router.get('/check_elastic', healthController.responseOk);

router.all('/v1/history/get_actions', accountActionsController.getActions);

router.all(
  '/v1/history/get_key_accounts',
  keyAccountController.getAccountsByPublicKey
);

router.all(
  '/v1/history/get_controlled_accounts',
  controlledAccountsController.getControlledAccounts
);

router.all(
  '/v1/history/get_platform_transfers_by_account',
  platformTransactionByAccountController.getActions
);

router.all(
  '/v1/history/get_transfers_by_account',
  transactionByAccountController.getActions
);

router.all(
  '/v1/history/get_transaction',
  transactionsController.getTransaction
);

router.all(
  '/v1/history/get_rewards_by_account',
  rewardController.getRewardsByAccount
);

export default router;
