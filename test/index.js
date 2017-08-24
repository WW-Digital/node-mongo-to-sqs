const MockSQS = require('./MockSQS');
const MongoDB = require('mongodb');
const MongoToSqs = require('..');
const ok = require('assert').ok;

const conn = 'mongodb://localhost:27017/test-mongo-to-sqs';
const collectionName = 'my-collection';
const numDocs = 250000;
const checkpoint = 10000;
const sqsLatency = 500;
const sqs = new MockSQS({ latency: sqsLatency });
const data = 'X'.repeat(10000);

function logCheckpoint(i) {
  if (i % 50000 === 0) {
    const n = i / 50000;
    process.stdout.write(`${n*50}k`);
  } else if (i % checkpoint === 0) {
    process.stdout.write('.');
  }
}

MongoDB.MongoClient.connect(conn).then(db => {
  return db.dropDatabase().then(() => db.close()).then(() => {
    return MongoDB.MongoClient.connect(conn).then(db => {
      let i = 1;
      const insertStart = new Date;
      function insertTestDocs() {
        const doc = {
          value: i,
          data
        };
        return db.collection(collectionName).insert(doc).then(() => {
          i++;
          if (i > numDocs) {
            return Promise.resolve((new Date - insertStart) + 'ms');
          } else {
            logCheckpoint(i);
            return insertTestDocs();
          }
        });
      }
      console.log(`Inserting ${numDocs} docs`);
      return insertTestDocs()
      .then(insertDuration => {
        console.log(`\ndone in ${insertDuration}.`);
        const cursor = db.collection(collectionName).find();
        const loader = new MongoToSqs({
          cursor,
          sqs,
          formatPayload: function (doc) {
            doc.customProperty = 123;
            logCheckpoint(doc.value);
            return doc;
          },
          queueUrl: 'https://example.com/000000000000/my-queue'
        });
        const loadStart = new Date;
        console.log(`Sending ${numDocs} mongo docs to sqs with a ${sqsLatency}ms SQS latency`);
        return loader.start().then(() => {
          return (new Date - loadStart) + 'ms';
        });
      });
    });
  });
})
.then(loadDuration => {
  const payload = JSON.parse(sqs.lastMessage.MessageBody);
  ok(sqs.messageCount === numDocs, 'messageCount');
  ok(payload.customProperty === 123, 'customProperty');
  console.log(`\ndone in ${loadDuration}`);
  process.exit(0);
})
.catch(err => {
  console.log(err);
  process.exit(1);
});