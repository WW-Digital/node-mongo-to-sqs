class MockSQS {

  constructor({ latency }) {
    this.messageCount = 0;
    this.latency = latency;
  }

  sendMessage(message) {
    this.messageCount++;
    this.lastMessage = message;
    return {
      promise: () => {
        return new Promise(resolve => {
          setTimeout(resolve, this.latency);
        });
      }
    };
  }

}

module.exports = MockSQS;