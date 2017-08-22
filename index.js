const through2Concurrent = require('through2-concurrent');

class MongoToSqs {

  constructor(options) {
    this.cursor = options.cursor; // db.collection(name).find()
    this.sqs = options.sqs; // new AWS.SQS()
    this.queueUrl = options.queueUrl; // https://sqs.us-east-1.amazonaws.com/000000000000/my-queue
    this.formatPayload = options.formatPayload || (doc => doc);
    this.mongoConcurrency = options.mongoConcurrency || 2500;
    // TODO: this.sqsBatchSize - instead of sending every sqs doc individually
  }

  sendToQueue(payload) {
    return this.sqs.sendMessage({
      MessageBody: JSON.stringify(payload),
      DelaySeconds: 0,
      QueueUrl: this.queueUrl
    }).promise()
      .then(() => {
        console.log('sent:', payload);
      });
  }

  start() {
    let count = 0;
    return new Promise((resolve, reject) => {
      this.cursor.pipe(through2Concurrent.obj({
        maxConcurrency: this.mongoConcurrency
      }, (doc, encoding, done) => {
        count += 1;
        const payload = this.formatPayload(doc);
        this.sendToQueue(payload)
          .then(() => {
            count -= 1;
            done();
          })
          .catch(err => {
            count -= 1;
            console.log('sendToQueue:', doc, err);
            done();
          });
      }));
      // done reading from mongo collection
      this.cursor.on('end', () => {
        // wait until all docs have been processed
        setInterval(() => {
          if (count === 0) resolve();
        }, 1000);
      });
    });
  }

}

module.exports = MongoToSqs;
