const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const User = require('../src/model/User');
const sequelize = require('../src/connection/database');
const en = require('../src/locales/en/translation.json');
const th = require('../src/locales/th/translation.json');

// ########################################
// ############### GLOBAL #################
// ########################################
beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await User.destroy({ truncate: true });
});

const activeUser = { username: 'user1', email: 'user1@mail.com', password: 'P4ssword', inactive: false };
const addUser = async (user = { ...activeUser }) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
  return await User.create(user);
};

const postAuthentication = async (credential, options = {}) => {
  let agent = request(app).post('/api/1.0/auth');
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return await agent.send(credential);
};

// ########################################
// ################ AUTH #################
// ########################################
describe('Authentication', () => {
  // HAPPY
  it('returns 200 when credentials are correct', async () => {
    await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });

    expect(response.status).toBe(200);
  });

  it('returns only user id and username and token when login success', async () => {
    const user = await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });

    expect(response.body.id).toBe(user.id);
    expect(response.body.username).toBe(user.username);
    expect(Object.keys(response.body)).toEqual(['id', 'username', 'token']);
  });

  // Unhappy for USERNAME
  it('returns 401 when user does not exits', async () => {
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.status).toBe(401);
  });

  it('returns proper error body when authenticate fails', async () => {
    const nowInMillis = new Date().getTime();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    const error = response.body;
    expect(error.path).toBe('/api/1.0/auth');
    expect(error.timestamp).toBeGreaterThan(nowInMillis);
    expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
  });

  //  Unhappy for USERNAME - i18next
  it.each`
    language | message
    ${'th'}  | ${th.authentication_failure}
    ${'en'}  | ${en.authentication_failure}
  `('return $message when authentication fails and language is set as $language', async ({ language, message }) => {
    console.log(language);
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' }, { language });
    expect(response.body.message).toBe(message);
  });

  // ### UNHAPPY - FOR PASSWORD

  it('return 401 when password is wrong', async () => {
    await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'WRONG-P4ssword' });
    expect(response.status).toBe(401);
  });

  // ### UNHAPPY - FOR INACTIVE
  it('return 403 when logging in with an inactive account', async () => {
    await addUser({ ...activeUser, inactive: true });
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });

    expect(response.status).toBe(403);
  });

  it('returns proper error body when inactive fails', async () => {
    addUser({ ...activeUser, inactive: true });
    const nowInMillis = new Date().getTime();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    const error = response.body;
    expect(error.path).toBe('/api/1.0/auth');
    expect(error.timestamp).toBeGreaterThan(nowInMillis);
    expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
  });

  it.each`
    language | message
    ${'th'}  | ${th.inactive_authentication_failure}
    ${'en'}  | ${en.inactive_authentication_failure}
  `(
    'return $message when authentication fails for inactive account and language is set as $language',
    async ({ language, message }) => {
      addUser({ ...activeUser, inactive: true });
      const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' }, { language });
      expect(response.body.message).toBe(message);
    }
  );

  // ### EMAIL INVALID FORMAT
  it('returns 401 when e-mail is not valid', async () => {
    const response = await postAuthentication({ email: 'mail.com', password: 'P4ssword' });

    expect(response.status).toBe(401);
  });

  it('returns 401 when password is not valid', async () => {
    const response = await postAuthentication({ email: 'mail.com' });

    expect(response.status).toBe(401);
  });

  // TOKEN
  it('returns token in response body when credentials are correct', async () => {
    await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });

    expect(response.body.token).not.toBeUndefined();
  });
});
