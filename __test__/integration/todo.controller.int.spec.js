const request = require('supertest');
const app = require('../../src/app');
const newTodo = require('../mocks/newTodo.json');
const db = require('../../src/connection/database');

const endpointUrl = '/api/1.0/todos/';
let firstTodo, newTodoId;

beforeAll(async () => {
  await db.sync();
});
describe(endpointUrl, () => {
  test('POST' + endpointUrl, async () => {
    const response = await request(app).post(endpointUrl).send(newTodo);
    // console.log(response);
    expect(response.statusCode).toBe(201);
    expect(response.body.todo.title).toBe(newTodo.title);
    expect(response.body.todo.done).toBe(newTodo.done);
  });

  test('PUT' + endpointUrl, async () => {
    newTodoId = newTodo.id;
    const testData = { ...newTodo, done: true };
    const res = await request(app)
      .put(endpointUrl + newTodoId)
      .send(testData);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('updated todo');
  });
});
