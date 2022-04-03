const mysql = require("mysql");
const dbConfig = require('../config/dbconfig');

var connection = mysql.createConnection({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  multipleStatements: true
});

module.exports = connection;

