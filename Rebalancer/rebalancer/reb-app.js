const {  Outbox } = require('./sequelize');
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

async function kafka_otv() {
    await producer.connect();
    const kafkaTransaction = await producer.transaction();

    try {
        const outboxMessages = await Outbox.findAll({ where: { published: false }, raw: true });
        let messages = outboxMessages
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
        return "Нашел и отправил: ", messages

    } catch (error) {
        await kafkaTransaction.abort();
        throw error;
    }
    finally{
        await producer.disconnect();
        
    }
}

setInterval(async () => {

    const res = await Outbox.findAll({ where: { published: false }, raw: true });

    if (res[0] != undefined){
        setTimeout(async () => {
            const otv = await kafka_otv();
            console.log(otv)
        }, 2000)
    }

}, 5000)