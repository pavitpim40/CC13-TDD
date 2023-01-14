const express = require('express');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',

    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      lookupHeader: 'accept-language',
    },
  });
const userRoute = require('./user/UserRoute');
const db = require('./config/database');
const app = express();

app.use(middleware.handle(i18next));
app.use(express.json());

// db.sync({ force: true });
db.authenticate()
  .then(() => console.log('DB connect'))
  .catch((err) => console.log(err));

app.use('/', userRoute);

module.exports = app;
