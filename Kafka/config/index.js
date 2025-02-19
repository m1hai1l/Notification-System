const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'create-app',
  brokers: ['kafka1:9092', 'kafka2:9092', 'kafka3:9094']
});

const admin = kafka.admin();

(async () => {
  try {
    await admin.connect();

    const topicConfig = {
      topics: [{
        topic: 'topic-notification',
        replicaAssignment: [
          { partition: 0, replicas: [1, 2, 3] },
          { partition: 1, replicas: [2, 3, 1] },
          { partition: 2, replicas: [3, 1, 2] }
        ],
        configEntries: []
      }],
      waitForLeaders: true
    };

    const created = await admin.createTopics(topicConfig);
    console.log('Topic created:', created);
  } catch (error) {
    console.error('Error creating topic:', error);
  } finally {
    await admin.disconnect();
  }
})();
