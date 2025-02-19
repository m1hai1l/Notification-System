const Sequelize = require("sequelize");
const sequelize = new Sequelize("Notification System", "postgres", "lira", {
    host: 'pg',
    dialect: "postgres",
    port: 5432,
    define: {
        timestamps: false,
        freezeTableName: true,
        logging: () => {}
    }
});


const UserState = sequelize.define('userstate', {
    chatId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
    },
    states: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    data: {
        type: Sequelize.JSONB,
        allowNull: true,
    },
});


const Notification = sequelize.define('notification', {
    id_not: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false 
    },
    texts: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    subject: {
        type: Sequelize.TEXT,
        allowNull: false
    }
    
});

const States = sequelize.define("states", {
    id_not: {
        type: Sequelize.STRING,
        references: {
            model: Notification,
            key: 'id_not'
        },
        primaryKey: true
    },
    states: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },

});

const Consumer = sequelize.define('consumer', {
    id_con: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false 
    },
    con: {
        type: Sequelize.TEXT,
        allowNull: false 
    },

});

const List = sequelize.define('list', {
    id_not: {
        type: Sequelize.STRING,
        references: {
            model: Notification,
            key: 'id_not'
        }
    },
    id_con: {
        type: Sequelize.STRING,
        references: {
            model: Consumer,
            key: 'id_con'
        },
        primaryKey: true
    },

});

const Outbox = sequelize.define('outbox', {
    key: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    value: {
        type: Sequelize.JSONB,
        allowNull: false
    },
    topic: {
        type: Sequelize.STRING,
        allowNull: false
    },
    partition: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    published: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
});


(async () => {
    await sequelize.sync();
})();


module.exports = {  Notification, States, Consumer, List, UserState, Outbox  }

