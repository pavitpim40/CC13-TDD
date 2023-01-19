// require('dotenv').config();
const app = require('./app');
const db = require('../src/config/database');

db.sync({ force: true });
app.listen(3000, () => {
  console.log('app is running');
});
