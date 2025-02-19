const TelegramBot = require('node-telegram-bot-api');
const token = '7590695311:AAHWFwbl4L97xu-YQOVRqWVB4s6luZwtaMQ';
const bot = new TelegramBot(token, {polling: true});
const validator = require("email-validator");
const  {  v4 : uuidv4  }  =  require ( 'uuid' ); 

const { run, kafka_otv } = require('./kafka-transation');

const { Notification, States, Consumer, List, UserState } = require('./sequelize-pg');


const setUserState = async (chatId, state, data ) => {
    await UserState.update({ states: state, data: data }, {
        where: {
            chatId: chatId
        }
    });
};

const getUserState = async (chatId) => {
    let userState = await UserState.findOne({ where: { chatId } });
    if (!userState) {
        await UserState.create({ chatId, state: 'awaiting_task', data: {} });
        userState = await UserState.findOne({ where: { chatId } });
    }
    
    return { state: userState.dataValues.states, data: userState.dataValues.data };

};


const resetUserState = async (chatId) => {
    await UserState.destroy({ where: { chatId } });
};


bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Добро пожаловать!", {
        reply_markup: {
            keyboard: [
                [{ text: "Отправка нотификации" }],
                [{ text: "Назад" }]
            ],
            resize_keyboard: true
        }
    });
});


bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const {state, data} = await getUserState(chatId);

    const post = "Отправка нотификации";
    if (msg.text.toString().indexOf(post) === 0){
        bot.sendMessage(chatId, `<b>Отправка нотификации</b> \nВведите передаваемое сообщение:`,{parse_mode : "HTML"})
        await setUserState(chatId, "text_state", {});
    }

    const again = "Назад";
    if (msg.text.toString().indexOf(again) === 0){
        if (state !== 'awaiting_task' && state !== null) {
            await resetUserState(chatId);
            bot.sendMessage(chatId, "<b>Можете начать заново!</b>", { parse_mode: "HTML" });
        } else {
            bot.sendMessage(chatId, "Вы уже находитесь в начальном состоянии.");
        }        
    }

    else if (state === 'text_state'){

        data.textt = msg.text;
        await setUserState(chatId, "subject_state", data)
        bot.sendMessage(chatId, `<b>Отправка нотификации</b>\nВведите свой email`,{parse_mode : "HTML"});
        
    }

    else if (state === 'subject_state'){
        if (validator.validate(msg.text)){
            data.sub = 'От ' + msg.text;
            data.idn = uuidv4()
            data.consumer = [];
            await setUserState(chatId, "consumer_state", data);
            await Notification.create({id_not: data.idn, texts: data.textt, subject: data.sub});
            bot.sendMessage(chatId, `<b>Отправка нотификации</b> \nВведите email получателя.`,{parse_mode : "HTML"});
        }
        else{
            bot.sendMessage(chatId, "Неверный формат email. Попробуйте снова.");
        }
    }
 
    else if (state === 'consumer_state') {
        if (msg.text.toLowerCase() === 'готово') {
            await States.create({id_not: data.idn, states: false});
            const otv = await run(data.idn, JSON.stringify({ text: data.textt, sub: data.sub, consumer: data.consumer }));
            if (otv){
                bot.sendMessage(chatId, `<b>Отправка нотификации завершена!</b>`, { parse_mode: "HTML" });
                const res = await kafka_otv();
                console.log("Готово, время: ", res);
                await resetUserState(chatId);
            } else {
                bot.sendMessage(chatId, `<b>Произошла ошибка, попробуйте позже!</b>`, { parse_mode: "HTML" });
                await resetUserState(chatId);
            }
        } else {
            if (validator.validate(msg.text)) {
                try {
                    data.idc = uuidv4();
                    data.consumer.push(msg.text);
                    await Consumer.create({id_con: data.idc, con: msg.text}); 
                    await List.create({ id_not: data.idn, id_con: data.idc })
                    await setUserState(chatId, 'consumer_state', data)
                    bot.sendMessage(chatId, `Получатель ${msg.text} добавлен. Введите следующий email или напишите "Готово".`);
                } catch (error) {
                    bot.sendMessage(chatId, "Произошла ошибка при добавлении получателя.");
                }
            } else {
                bot.sendMessage(chatId, "Неверный формат email. Попробуйте снова.");
            }
        }
    }

    if (!(msg.text.toString().indexOf(post) === 0) && 
        !(msg.text.toString().indexOf(again) === 0) &&
        (state == 'awaiting_task' || state == null) && msg.text != '/start'){
        bot.sendMessage(chatId, "Введите корректное действие")
    };
});

