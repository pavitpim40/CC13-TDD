const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const db = require('../src/config/database');

beforeAll(() => {
  return db.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});
describe('User Registration', () => {
  const validUser = {
    username: 'user1',
    email: 'user1@mail.com',
    password: 'P4ssword',
  };
  const postUser = (user) => {
    return request(app).post('/api/1.0/users').send(user);
  };
  it('returns 200 OK when signup request is valid', async () => {
    const response = await postUser(validUser);
    expect(response.status).toBe(200);
  });

  it('returns success message when signup request is valid', async () => {
    const response = await postUser(validUser);
    expect(response.body.message).toBe('User Created');
  });

  it('saves the user database', async () => {
    await postUser(validUser);
    // query user table
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('saves the username and email to database', async () => {
    await postUser(validUser);
    // query user table
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  it('hashed the password in database', async () => {
    await postUser(validUser);
    // query user table
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('P4ssword');
  });

  it('returns 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });

    expect(response.status).toBe(400);
  });

  it('returns validationErrors field in response body when validation error occurs ', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });

    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  // it.each([
  //   ['username', 'Username cannot be null'],
  //   ['email', 'Email cannot be null'],
  //   ['password', 'Password cannot be null'],
  // ])('when %s is null %s is received', async (field, expectedMessage) => {
  //   const user = {
  //     username: 'user1',
  //     email: null,
  //     password: 'P4ssword',
  //   };
  //   user[field] = null;
  //   const response = await postUser(user);
  //   expect(response.body.validationErrors[field]).toBe(expectedMessage);
  // });

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${'Username cannot be null'}
    ${'username'} | ${'usr'}           | ${'Must have min 4 and max 32 character'}
    ${'username'} | ${'a'.repeat(33)}  | ${'Must have min 4 and max 32 character'}
    ${'email'}    | ${null}            | ${'Email cannot be null'}
    ${'email'}    | ${'mail.com'}      | ${'Email is not valid'}
    ${'email'}    | ${'user@mail'}     | ${'Email is not valid'}
    ${'password'} | ${null}            | ${'Password cannot be null'}
    ${'password'} | ${'P4ss'}          | ${'Password must be at least 6 character'}
    ${'password'} | ${'alllowercase'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'ALLUPPERCASE'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'12345678'}      | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerANDupper'} | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerand12341'} | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'UPPERAND12341'} | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
  `('returns $expectedMessage when $field is null', async ({ field, value, expectedMessage }) => {
    const user = {
      username: 'user1',
      email: null,
      password: 'P4ssword',
    };
    user[field] = value;
    const response = await postUser(user);
    expect(response.body.validationErrors[field]).toBe(expectedMessage);
  });
  // it('returns Username cannot be null when username is null', async () => {
  //   const response = await postUser({
  //     username: null,
  //     email: 'user1@mail.com',
  //     password: 'P4ssword',
  //   });

  //   const body = response.body;
  //   expect(body.validationErrors.username).toBe('Username cannot be null');
  // });
  // it('returns E-mail cannot be null when email is null', async () => {
  //   const response = await postUser({
  //     username: 'user1',
  //     email: null,
  //     password: 'P4ssword',
  //   });

  //   const body = response.body;
  //   expect(body.validationErrors.email).toBe('Email cannot be null');
  // });

  // it('returns Password cannot be null message when password  is null', async () => {
  //   const response = await postUser({
  //     username: 'user1',
  //     email: 'user1@mail.com',
  //     password: null,
  //   });

  //   const body = response.body;
  //   expect(body.validationErrors.password).toBe('Password cannot be null');
  // });
  // it('returns errors for both when username and email are null', async () => {
  //   const response = await postUser({
  //     username: null,
  //     email: null,
  //     password: 'P4ssword',
  //   });

  //   const body = response.body;
  //   expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  // });

  it('return size validation error when username is less than 4 character', async () => {
    const user = {
      username: 'usr',
      email: null,
      password: 'P4ssword',
    };

    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors.username).toBe('Must have min 4 and max 32 character');
  });

  it('returns E-mail in use when same email is already in use', async () => {
    await User.create(validUser);
    const response = await postUser(validUser);
    console.log(response.body);
    expect(response.body.validationErrors.email).toBe('E-mail in use');
  });

  it('returns errors for both username is null and email is in use', async () => {
    await User.create(validUser);
    const response = await postUser({
      ...validUser,
      username: null,
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
});
