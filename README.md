# mongo-to-sqs

Send 

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
  cursor,         // db.collection.find()
  sqs,            // new AWS.SQS()
  queueUrl,       // the url of the SQS queue
  formatPayload,  // sync function to transform the document into the SQS MessageBody
  concurrency     // defaults to 2500 documents to be sent in parallel
});

loader.start().then(() => console.log('Done.'));
```

# Example

```js
const MongoDB = require('mongodb');
const AWS = require('aws-sdk');
const MongoToSqs = require('mongo-to-sqs');

MongoDB.MongoClient.connect().then(db => {
  
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

});
```

# License 

MIT