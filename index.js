const through2Concurrent = require('through2-concurrent');

class MongoToSqs {

  constructor(options) {
    this.cursor = options.cursor; // db.collection(name).find()
    this.sqs = options.sqs; // new AWS.SQS()
    this.queueUrl = options.queueUrl; // https://sqs.us-east-1.amazonaws.com/000000000000/my-queue
    this.formatPayload = options.formatPayload || (doc => doc);
    this.concurrency = options.concurrency || 2500;
    this.started = false;
    this.cursorEnd = false;
    // TODO: this.sqsBatchSize - instead of sending every sqs doc individually
  }

  sendToQueue(payload) {
    return this.sqs.sendMessage({
      MessageBody: JSON.stringify(payload),
      QueueUrl: this.queueUrl
    }).promise();
  }

  start() {
    if (this.started) {
      throw new Error('SQS loader has already started.');
    }
    this.started = true;
    let count = 0;
    return new Promise(resolve => {
      const handleSQSResponse = (done) => {
        count -= 1;
        done();
        // if all docs have successfully queued onto SQS
        if (this.cursorEnd && count === 0) {
          resolve();
        }
      };
      this.cursor.pipe(through2Concurrent.obj({
        maxConcurrency: this.concurrency
      }, (doc, encoding, done) => {
        count += 1;
        const payload = this.formatPayload(doc);
        this.sendToQueue(payload)
          .then(() => {
            handleSQSResponse(done);
          })
          .catch(err => {
            console.log('sendToQueue:', doc, err);
            handleSQSResponse(done);
          });
      }));
      // done reading from mongo collection
      this.cursor.on('end', () => {
        this.cursorEnd = true;
      });
    });
  }

}

module.exports = MongoToSqs;
