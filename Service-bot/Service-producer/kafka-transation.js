const { States, Outbox } = require('./sequelize-pg');
const  {  parse : uuidParse  }  =  require ( 'uuid' );

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: "producer-service-1",
    brokers: ['kafka1:9092', 'kafka2:9093', 'kafka3:9094']
}); 

const producer = kafka.producer({
    transactionalId: 'notifications',
    idempotent: true,
    maxInFlightRequests: 1
});

const part = (uuid) => {
    return uuidParse(uuid).reduce((acc, num) => acc + num, 0) % 3
}

async function run(id, obj) {
    const id_partition = part(id);
    const dbTransaction = await States.sequelize.transaction();
    try {

        await Outbox.create({
            key: id,
            value: obj,
            topic: "topic-notification",
            partition: id_partition,
            published: false 
            }, { transaction: dbTransaction });
            
        await States.update({ states: true }, {
            where: { id_not: id },
            transaction: dbTransaction
        });

        await dbTransaction.commit();
        return true
    } catch (error) {
        await dbTransaction.rollback();
        throw error;
    }
}


async function kafka_otv() {
    const data = Date.now();
    await producer.connect();
    const kafkaTransaction = await producer.transaction();

    try {
        
        const outboxMessages = await Outbox.findAll({ where: { published: false }, raw: true });
        if (outboxMessages.length > 0) {
            for (let i = 0; i < outboxMessages.length; i++){

                let messag = outboxMessages[i]
                await kafkaTransaction.send({
                    topic: "topic-notification",
                    messages: [ {
                        key: messag.key,
                        value: messag.value,
                        partition: messag.partition
                    }]
                });
    
                await Outbox.update({ published: true }, {
                    where: {
                        key: messag.key
                    }
                });
            }
            await kafkaTransaction.commit();

        } else {
            await kafkaTransaction.commit();
        }
    } catch (error) {
        await kafkaTransaction.abort();
        throw error;
    }
    finally{
        await producer.disconnect();
        return Date.now() - data;
    }
}


module.exports = { run, kafka_otv };