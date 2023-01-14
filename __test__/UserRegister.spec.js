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

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
};
const postUser = (user, options = {}) => {
  const agent = request(app).post('/api/1.0/users');
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return agent.send(user);
};
describe('User Registration', () => {
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

  const username_null = 'Username cannot be null';
  const username_size = 'Must have min 4 and max 32 character';
  const email_null = 'Email cannot be null';
  const email_invalid = 'Email is not valid';
  const email_inuse = 'Email in use';
  const password_null = 'Password cannot be null';
  const password_size = 'Password must be at least 6 character';
  const password_invalid = 'Password must have at least 1 uppercase, 1 lowercase letter and 1 number';
  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${username_null}
    ${'username'} | ${'usr'}           | ${username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${username_size}
    ${'email'}    | ${null}            | ${email_null}
    ${'email'}    | ${'mail.com'}      | ${email_invalid}
    ${'email'}    | ${'user@mail'}     | ${email_invalid}
    ${'password'} | ${null}            | ${password_null}
    ${'password'} | ${'P4ss'}          | ${password_size}
    ${'password'} | ${'alllowercase'}  | ${password_invalid}
    ${'password'} | ${'ALLUPPERCASE'}  | ${password_invalid}
    ${'password'} | ${'12345678'}      | ${password_invalid}
    ${'password'} | ${'lowerANDupper'} | ${password_invalid}
    ${'password'} | ${'lowerand12341'} | ${password_invalid}
    ${'password'} | ${'UPPERAND12341'} | ${password_invalid}
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

  it(`returns ${email_inuse} when same email is already in use`, async () => {
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

describe('Internationalization', () => {
  const username_null = 'กรุณากำหนดผู้ชื่อใช้งาน';
  const username_size = 'ชื่อผู้ใช้งานต้องมีความยาวระหว่าง 4-32 ตัวอักษร';
  const email_null = 'กรุณากำหนดอีเมลล์';
  const email_invalid = 'รูปแบบอีเมลล์ไม่ถูกต้อง';
  const email_inuse = 'อีเมลล์นี้ถูกใช้งานแล้ว';
  const password_null = 'รหัสผ่านไม่สามารถเว้นว่างได้';
  const password_size = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
  const password_invalid = 'รหัสผ่านต้องประกอบด้วยอักษรภาษาอังกฤษตัวเล็ก,ตัวใหญ่ และตัวเลข อย่างน้อยอย่างละ 1 ตัว';
  const user_create_success = 'สร้างบัญชีผู้ใช้งานสำเร็จ';
  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${username_null}
    ${'username'} | ${'usr'}           | ${username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${username_size}
    ${'email'}    | ${null}            | ${email_null}
    ${'email'}    | ${'mail.com'}      | ${email_invalid}
    ${'email'}    | ${'user@mail'}     | ${email_invalid}
    ${'password'} | ${null}            | ${password_null}
    ${'password'} | ${'P4ss'}          | ${password_size}
    ${'password'} | ${'alllowercase'}  | ${password_invalid}
    ${'password'} | ${'ALLUPPERCASE'}  | ${password_invalid}
    ${'password'} | ${'12345678'}      | ${password_invalid}
    ${'password'} | ${'lowerANDupper'} | ${password_invalid}
    ${'password'} | ${'lowerand12341'} | ${password_invalid}
    ${'password'} | ${'UPPERAND12341'} | ${password_invalid}
  `('returns $expectedMessage when $field is null', async ({ field, value, expectedMessage }) => {
    const user = {
      username: 'user1',
      email: null,
      password: 'P4ssword',
    };
    user[field] = value;
    const response = await postUser(user, { language: 'th' });
    expect(response.body.validationErrors[field]).toBe(expectedMessage);
  });

  it(`returns ${email_inuse} when same email is already in use`, async () => {
    await User.create(validUser);
    const response = await postUser(validUser, { language: 'th' });
    console.log(response.body);
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it(`returns ${user_create_success} when signup request is valid`, async () => {
    const response = await postUser(validUser, { language: 'th' });
    expect(response.body.message).toBe(user_create_success);
  });
});
