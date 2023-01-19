// require('dotenv').config();
const app = require('./src/app.js');
const db = require('./src/connection/database');

db.sync({ force: true });
app.listen(3000, () => {
  console.log('app is running');
});
