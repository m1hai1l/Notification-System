const { Kafka } = require('kafkajs');
const { sendMails } = require('./senders');

const kafka = new Kafka({
    clientId: 'sender_1',
    brokers: ['kafka1:9092', 'kafka2:9093', 'kafka3:9094']
});

const consumer = kafka.consumer({
    groupId: 'sender-consumer-worker'
});


const run = async () => {
    await consumer.connect();
    await consumer.subscribe({topic: 'topic-notification', fromBeginning: true});

    await consumer.run({
        eachBatchAutoResolve: false,
        eachBatch: async({batch, resolveOffset, heartbeat,commitOffsetsIfNecessary, isRunning, isStale}) => {
            for (let message of batch.messages){
                if (!isRunning() || isStale()) break;

                console.log("начало")
                
                try{
                    const partitions = batch.partition
                    const mesg = JSON.parse(message.value.toString())
                    console.log("Offset: ", message.offset, " Partition: ", partitions)
                    
                    const con = mesg.consumer.join(', ')

                    const dat = await sendMails(con, mesg.sub, mesg.text)

                    console.log("Время: ", dat);

                    resolveOffset(message.offset)
                    await heartbeat()

                }catch (e){
                    const subscribe = mesg.sub.split(' ')[1];
                    await sendMails(subscribe, 'Ошибка при отправке!', 'Пожалуйста попробуйте снова!');
                    console.error('Error', e);
                    break;
                }
            }
            await commitOffsetsIfNecessary();
        }
    });
};

run().catch(console.error)
