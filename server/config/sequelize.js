const Sequelize = require("sequelize");
require("dotenv").config();
const db = new Sequelize(
  process.env.DATABASE,
  process.env.USER, 
  process.env.PASSWORD,
  {
    host: process.env.DB_HOST || 'sql.freedb.tech',
    //host: 'localhost',
    port: 3306,
    dialect: "mysql",
    logging: console.log,
    timezone: "+07:00",
  }
);



module.exports = {
  initDB: () => {
    return db.authenticate();
  },
  getDB: () => {
    return db;
  },
};
