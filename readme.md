# Snax elastic search history api

This api implements snax history endpoints.

## Create & Delete Index Templates

If you want to customize mapping or setting of indices, just modify json files in the `templates` directory.

Running `index-tempate.sh` script to create or delete indice templates.

```bash
# e.g.
./index-templates.sh --action create --dir ./templates --url http://localhost:9200
./index-templates.sh --action delete --dir ./templates --url http://localhost:9200
```

## Getting started

### Installation

#### Node js

1. Clone this repository
2. Install dependencies by running, `yarn` or `npm i`
3. Start `yarn start` or `npm run start`

### Endpoints

| resource                             | description                                                    |
| :----------------------------------- | :------------------------------------------------------------- |
| `/health`                            | used to check the server health                                |
| `/check_elastic`                     | userd to check elastic status                                  |
| `/v1/history/get_actions`            | Returns array of actions of a given account                    |
| `/v1/history/get_transaction`        | Returns array of traces of the transaction                     |
| `/v1/history/get_platform_actions`   | Returns array of actions of a given account on platform        |
| `/v1/history/get_rewards_by_account` | Returns array of reward actions of a given account on platform |

### Env

`NODE_ENV` - node env(production, development, test)

`PORT` - server port. Default is `3000`

`HOST` - server host. Default is `localhost`

`ELASTIC_HOST` - elasticsearch host. Default is `localhost`

`ELASTIC_PROTOCOL` - elasticsearch protocol(`http` or `https`). Default is `http`

`ELASTIC_PORT` - elasticsearch port. Default is `9200`

`MANUAL_FILTER_ACCOUNTS` - specify accounts with possible trx duplicates. Should be comma separated values. Default is `p.twitter,p.steemit`

### Usage

#### /v1/history/get_actions

Requires json body with the following properties:  
account_name - name of the snax account. This field is required.  
pos - position in a list of account actions sorted by global_sequence (e.g. in chronological order). This field is not required.  
offset - number of actions to return. This field is not required.  
Example of request body:

    {
        "account_name": "snax",
        "pos": -1,
        "offset": 20
    }

Returns json with the following properties:  
actions - array of actions of a given account

#### /v1/history/get_transaction

Requires json body with the following properties:
id - id of a transaction.
Example of request body:

    {
        "id": "e6c814f9ba58e2aedd654abfdefc99c98f3e4bf5f20e4820b7d212f38f1f6f13"
    }

Returns json with the following properties:
id - id of a transaction.
trx - transaction.
block_time - timestamp of the block which contains the requested transaction.
block_num - number of the block which contains the requested transaction.
traces - traces of the transaction.

#### /v1/history/get_platform_transfers_by_account

Requires json body with the following properties:  
platform - chain platform({'p.twitter': { id: USER_ID } }). This field is required
account_name - name of the snax account. This field is not required.  
pos - position in a list of account actions sorted by global_sequence (e.g. in chronological order). This field is not required.  
offset - number of actions to return. This field is not required.  
Example of request body:

    {
        "account_name": "eminem", "platform": { "p.twitter": {"id": "2314465404"} }, "pos": -1, "offset": -20
    }

Returns json with the following properties:  
actions - array of actions of a given platform account and rewards

#### /v1/history/get_transfers_by_account

Requires json body with the following properties:  
platform - chain platform({'p.twitter': { id: USER_ID } }). This field is required
account_name - name of the snax account. This field is not required.  
pos - position in a list of account actions sorted by global_sequence (e.g. in chronological order). This field is not required.  
offset - number of actions to return. This field is not required.  
Example of request body:

    {
        "account_name": "eminem", "platform": { "p.twitter": {"id": "2314465404"} }, "pos": -1, "offset": -20
    }

Returns json with the following properties:  
actions - array of all transfers for account

#### /v1/history/get_key_accounts

Requires json body with the following properties:  
public_key - public key of account
Example of request body:

    {
        "public_key": "SNAX8NCsTC3hJFoRevLumANLpNc38Z3kfWb7dEjjwU1Vs1rioZZkPw"
    }

Returns json with the following properties:  
account_names - array of accounts that have a requested key

#### /v1/history/get_controlled_accounts

Requires json body with the following properties:  
controlling_account - name of the eos account  
Example of request body:

    {
        "controlling_account": "snax"
    }

Returns json with the following properties:  
controlled_accounts - array of accounts controlled by a requested account

#### /v1/history/get_rewards_by_account

Requires json body with the following properties:  
platform - chain platform({'p.twitter': { id: USER_ID } }). This field is required
account_name - name of the snax account. This field is not required.  
pos - position in a list of account actions sorted by global_sequence (e.g. in chronological order). This field is not required.  
offset - number of actions to return. This field is not required.  
Example of request body:

    {
        "account_name": "eminem", "platform": { "p.twitter": {"id": "2314465404"} }, "pos": -1, "offset": -20
    }

Returns json with the following properties:  
actions - array of all transfers for account
