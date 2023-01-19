const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const db = require('../src/config/database');

// const nodemailerStub = require('nodemailer-stub');
// const EmailService = require('../src/email/EmailService');
const SMTPServer = require('smtp-server').SMTPServer;

let lastMail, server;
let simulateSmtpFailure = false;
beforeAll(async () => {
  lastMail = '';
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody = '';

      // stream.pipe(process.stdout);
      stream.on('data', (data) => {
        // console.log('Stream\n', data.toString());
        mailBody += data.toString();
      });
      stream.on('end', () => {
        if (simulateSmtpFailure) {
          const err = new Error('Invalid mailboxx');
          err.responseCode = 553;
          return callback(err);
        }
        // console.log('TOF', typeof mailBody);
        lastMail = mailBody;
        callback();
      });
    },
  });
  await server.listen(8587, 'localhost');
  await db.sync();
});

beforeEach(() => {
  simulateSmtpFailure = false;
  return User.destroy({ truncate: true });
});

afterEach(() => {
  // restore the spy created with spyOn

  jest.restoreAllMocks();
});

afterAll(async () => {
  await server.close();
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
    // console.log(response.body);
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

  it('create user in inactive mode even the request body contains inactive as false', async () => {
    // Arrange
    const newUser = { ...validUser, inactive: false };
    await postUser({ ...newUser });
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates user in inactive mode even the request body contains inactive as false', async () => {
    await postUser({ ...validUser, inactive: false });
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates an activationToken for user', async () => {
    await postUser({ ...validUser, inactive: false });
    const users = await User.findAll();
    const savedUser = users[0];
    // expect(savedUser.activationToken).not.toBeUndefined();
    expect(savedUser.activationToken).toBeTruthy();
  });

  it('sends an Account activation email with activationToken', async () => {
    await postUser({ ...validUser });
    // const lastMail = nodemailerStub.interactsWithMail.lastMail();
    // console.log(lastMail);

    // expect(lastMail.to[0]).toBe('user1@mail.com');
    // console.log(lastMail);
    // console.log(typeof lastMail);
    expect(lastMail).toContain('user1@mail.com');

    const users = await User.findAll();
    const savedUser = users[0];
    // expect(savedUser.activationToken).not.toBeUndefined();
    expect(lastMail).toContain(savedUser.activationToken);
  });

  it('returns 502 Bad Gateway when sending email fails', async () => {
    // const
    // set Expectation
    // const mockSendAccountActivation = jest
    //   .spyOn(EmailService, 'sendAccountActivation')
    //   .mockImplementation(() => Promise.reject({ message: 'Failed to deliver email' }));
    // .mockRejectedValue({ message: 'Failed to deliver email' });
    simulateSmtpFailure = true;
    // Act
    const response = await postUser({ ...validUser });

    // Assert
    expect(response.status).toBe(502);

    // Tear Down
    // mockSendAccountActivation.mockRestore();
  });

  it('returns Email failure message when sending email fails', async () => {
    simulateSmtpFailure = true;
    // set Expectation
    // const mockSendAccountActivation = jest
    //   .spyOn(EmailService, 'sendAccountActivation')
    //   .mockImplementation(() => Promise.reject({ message: 'Failed to deliver email' }));
    // .mockRejectedValue({ message: 'Failed to deliver email' });

    // Act
    const response = await postUser({ ...validUser });

    // Assert
    expect(response.body.message).toBe('E-mail Failure');

    // Tear Down
    // mockSendAccountActivation.mockRestore();
  });

  it('does not save user to database if activation email fails', async () => {
    simulateSmtpFailure = true;
    // // set Expectation
    // const mockSendAccountActivation = jest
    //   .spyOn(EmailService, 'sendAccountActivation')
    //   .mockImplementation(() => Promise.reject({ message: 'Failed to deliver email' }));
    // .mockRejectedValue({ message: 'Failed to deliver email' });

    // Act
    await postUser({ ...validUser });
    const users = await User.findAll();

    // Assert
    expect(users.length).toBe(0);

    // Tear Down
    // mockSendAccountActivation.mockRestore();
  });

  it('returns validation Failure message in error response body when validation fails', async () => {
    const response = await postUser({ ...validUser, username: null });

    expect(response.body.message).toBe('Validation Failure');
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
  const email_failure = 'ส่งอีเมล์ยืนยันการสมัครไม่สำเร็จ';
  const validation_failure = 'รูปแบบข้อมูลไม่ถูกต้อง';
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
    // console.log(response.body);
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it(`returns ${user_create_success} when signup request is valid`, async () => {
    const response = await postUser(validUser, { language: 'th' });
    expect(response.body.message).toBe(user_create_success);
  });

  // Email i18
  it(`returns ${email_failure} message when sending email fails`, async () => {
    simulateSmtpFailure = true;
    // set Expectation
    // const mockSendAccountActivation = jest
    //   .spyOn(EmailService, 'sendAccountActivation')
    //   .mockImplementation(() => Promise.reject({ message: 'Failed to deliver email' }));
    // .mockRejectedValue({ message: 'Failed to deliver email' });

    // Act
    const response = await postUser({ ...validUser }, { language: 'th' });

    // Assert
    expect(response.body.message).toBe(email_failure);

    // Tear Down
    // mockSendAccountActivation.mockRestore();
  });

  it(`returns ${validation_failure} message in error response body when validation fails`, async () => {
    const response = await postUser({ ...validUser, username: null }, { language: 'th' });

    expect(response.body.message).toBe(validation_failure);
  });
});

describe('Account activation', () => {
  it('activates the account when correct token is sent', async () => {
    await postUser({ ...validUser });
    let users = await User.findAll();
    const token = users[0].activationToken;

    // ACT
    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    users = await User.findAll();

    expect(users[0].inactive).toBe(false);
  });

  it('remove activationToken from user table after successful activation', async () => {
    await postUser({ ...validUser });
    let users = await User.findAll();
    const token = users[0].activationToken;

    // ACT
    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    // Assert
    users = await User.findAll();
    expect(users[0].activationToken).toBeFalsy();
  });

  it('it does not activate the account when token is wrong ', async () => {
    await postUser({ ...validUser });
    // let users = await User.findAll();
    const token = 'this-token-does-not-exists';

    // ACT
    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    // Assert
    let users = await User.findAll();
    expect(users[0].inactive).toBe(true);
  });

  it('it return bad request when token is wrong ', async () => {
    await postUser({ ...validUser });
    // let users = await User.findAll();
    const token = 'this-token-does-not-exists';

    // ACT
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    // Assert
    // users = await User.findAll();
    // expect(users[0].inactive).toBe(true);
    expect(response.status).toBe(400);
  });

  // happy+unhappy : message
  it.each`
    language | tokenStatus  | message
    ${'th'}  | ${'wrong'}   | ${'บัญชีนี้มีการเปิดใช้งานไปแล้วหรือการเปิดใช้งานไม่ถูกต้อง'}
    ${'en'}  | ${'wrong'}   | ${'This account either active or the token is invalid'}
    ${'th'}  | ${'correct'} | ${'ยืนยันการเปิดใช้งานบัญชีสำเร็จ'}
    ${'en'}  | ${'correct'} | ${'Account is activated'}
  `(
    'returns $message when wrong token is send and language is $language',
    async ({ language, tokenStatus, message }) => {
      await postUser({ ...validUser });
      let token = 'this-token-does-not-exists';
      if (tokenStatus === 'correct') {
        let users = await User.findAll();
        token = users[0].activationToken;
      }
      const response = await request(app)
        .post('/api/1.0/users/token/' + token)
        .set('Accept-language', language)
        .send();

      expect(response.body.message).toBe(message);
    }
  );
});

// ####################### 4
describe('Error Model', () => {
  it('returns path, timestamp, message and validationErrors in response when validation failure', async () => {
    const response = await postUser({ ...validUser, username: null });
    const body = response.body;
    expect(Object.keys(body)).toStrictEqual(['path', 'timestamp', 'message', 'validationErrors']);
  });

  it('returns path, timestamp and message in response when request fail other than validation error', async () => {
    await postUser({ ...validUser });
    // let users = await User.findAll();
    const token = 'this-token-does-not-exists';

    // ACT
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    const body = response.body;
    expect(Object.keys(body)).toStrictEqual(['path', 'timestamp', 'message']);
  });

  it('returns path in error body', async () => {
    await postUser({ ...validUser });
    // let users = await User.findAll();
    const token = 'this-token-does-not-exists';

    // ACT
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    const body = response.body;
    expect(body.path).toEqual('/api/1.0/users/token/' + token);
  });

  it('returns timestamp in milliseconds within 5 seconds value in error body', async () => {
    const nowInMillis = new Date().getTime();
    const fiveSecondsLater = nowInMillis + 5 * 1000;
    await postUser({ ...validUser });
    // let users = await User.findAll();
    const token = 'this-token-does-not-exists';

    // ACT
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    const timestamp = response.body.timestamp;
    expect(timestamp).toBeGreaterThan(nowInMillis);
    expect(timestamp).toBeLessThan(fiveSecondsLater);
  });
});
