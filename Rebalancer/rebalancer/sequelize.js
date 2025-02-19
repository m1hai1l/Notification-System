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



module.exports = { Outbox }