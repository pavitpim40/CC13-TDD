const request = require('supertest');
const app = require('../../src/app');
const newTodo = require('../mocks/newTodo.json');
const allTodos = require('../mocks/allTodos.json');
const { Todo } = require('../../src/model');
const db = require('../../src/connection/database');

const endpointUrl = '/api/1.0/todos/';
let firstTodo, newTodoId;

beforeAll(async () => {
  await db.sync();
});

beforeEach(async () => {
  await Todo.destroy({ truncate: true });
});

const postTodo = async (todo = { ...newTodo }) => {
  return await request(app).post(endpointUrl).send(todo);
};
describe(endpointUrl, () => {
  test('POST' + endpointUrl, async () => {
    const response = await postTodo();
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

  test('Get By Id' + endpointUrl + ':todoId', async () => {
    firstTodo = newTodo;
    await postTodo();
    const response = await request(app).get(endpointUrl + firstTodo.id);
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(firstTodo.title);
    expect(response.body.done).toBe(firstTodo.done);
  });

  test("Get todo by id doesn't exist" + endpointUrl + ':todoId', async () => {
    const response = await request(app).get(endpointUrl + 'randomId');
    expect(response.statusCode).toBe(404);
  });

  test('Get All Todo', async () => {
    await Todo.bulkCreate(allTodos);
    const response = await request(app).get(endpointUrl);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body[0].title).toBeDefined();
    expect(response.body[0].done).toBeDefined();
    firstTodo = response.body[0];
  });
});
