# mongo-to-sqs

[![Build Status](https://travis-ci.org/WW-Digital/node-mongo-to-sqs.svg?branch=master)](https://travis-ci.org/WW-Digital/node-mongo-to-sqs)

- Populates SQS with documents from MongoDB
- Uses back-pressure to prevent buffering documents in memory
- Works with very large collections

# Install

```
npm i mongo-to-sqs
```

# Usage

```js
const MongoToSqs = require('mongo-to-sqs');

const loader = new MongoToSqs({
  cursor,
  sqs,
  queueUrl,
  formatPayload,
  sqsBatchSize,
  concurrency // default 2500
});

loader.start().then(() => console.log('Done.'));
```

# Example

```js
const MongoDB = require('mongodb');
const AWS = require('aws-sdk');
const MongoToSqs = require('mongo-to-sqs');

const db = MongoDB.MongoClient.connect();
const cursor = db.collection('my-collection').find();

const sqs = new AWS.SQS({
  accessKeyId: '...',
  secretAccessKey: '...'
});

const loader = new MongoToSqs({
  cursor,
  sqs,
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/000000000000/my-queue'
});

loader.start().then(() => console.log('Done.'));
```
