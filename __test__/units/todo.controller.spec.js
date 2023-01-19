const httpMocks = require('node-mocks-http');
const TodoController = require('../../src/controllers/TodoController');
const { Todo } = require('../../src/model');

const newTodo = require('../mocks/newTodo.json');

// #### CREATE TODO

let req, res, next;
const todoId = 1;

beforeAll(() => {
  Todo.create = jest.fn();
  Todo.update = jest.fn();
  Todo.findByPk = jest.fn();
});

beforeEach(() => {
  req = httpMocks.createRequest();
  res = httpMocks.createResponse();
  next = jest.fn();
});

// ################  1.CREATE TODO
describe('TodoController.createTodo', () => {
  // SETUP

  beforeEach(() => {
    req.body = newTodo;
  });
  it('should have a create Todo function', () => {
    expect(typeof TodoController.createTodo).toBe('function');
  });

  // TEST ใน Service Level ได้
  it('should call TodoModel.create', () => {
    TodoController.createTodo(req, res, next);
    expect(Todo.create).toBeCalled();
    expect(Todo.create).toBeCalledWith(newTodo);
  });

  it('should return 201 response code', async () => {
    await TodoController.createTodo(req, res, next);
    expect(res.statusCode).toBe(201);
    expect(res._isEndCalled()).toBeTruthy();
  });

  it('should return json body in response', async () => {
    // STUB / MOCK
    Todo.create.mockReturnValue(newTodo);
    await TodoController.createTodo(req, res, next);
    // expect(res._getJSONData()).toBe(newTodo); // fail because different ref
    // console.log(res._getJSONData());
    expect(res._getJSONData().todo).toStrictEqual(newTodo);
  });

  it('should handle errors', async () => {
    // MOCK : Change Behavior
    const errorMessage = { message: 'property missing' };
    const rejectedPromise = Promise.reject(errorMessage);
    Todo.create.mockReturnValue(rejectedPromise);
    await TodoController.createTodo(req, res, next);
    expect(next).toBeCalledWith(errorMessage);
  });
});

// ################ 2.Update TODO

describe('TodoController.updateTodo', () => {
  // #1
  it('should have a updateTodo function', () => {
    expect(typeof TodoController.updateTodo).toBe('function');
  });

  it('should call  TodoModel.findByPK', async () => {
    // ARRANGE
    req.params.todoId = todoId;
    req.body = newTodo;

    // ACT
    await TodoController.updateTodo(req, res, next);

    // ASSERT : SPY
    expect(Todo.update).toHaveBeenCalledWith(newTodo, { where: { id: todoId } });
  });

  it('should return a response with json data and http code 200', async () => {
    req.params.todoId = todoId;
    req.body = newTodo;
    Todo.update.mockReturnValue([1]);
    await TodoController.updateTodo(req, res, next);

    // ASSERT : MOCK
    expect(res._isEndCalled()).toBeTruthy();
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toStrictEqual({ message: 'updated todo' });
  });

  it('should handle errors', async () => {
    // ARRANGE - Expectation
    const errorMessage = { message: "can't update todo" };
    const rejectedPromise = Promise.reject(errorMessage);
    Todo.update.mockReturnValue(rejectedPromise);

    // ACT
    await TodoController.updateTodo(req, res, next);

    // Assert - Verify
    expect(next).toBeCalledWith(errorMessage);
  });

  it("should return 404 when  when todoId doesn't exits", async () => {
    Todo.update.mockReturnValue(null);
    await TodoController.updateTodo(req, res, next);
    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBeTruthy();
  });
});

// ################ 3.Get TODO by Id

describe('TodoController.getTodoById', () => {
  it('should have getTodoById as a function', () => {
    expect(typeof TodoController.getTodoById).toBe('function');
  });

  it('should be TodoModel.findById with route parameters', async () => {
    req.params.todoId = todoId;
    await TodoController.getTodoById(req, res, next);
    expect(Todo.findByPk).toBeCalledWith(todoId);
  });

  // #3
  it('should return json body and response code 200', async () => {
    // req.params.todoId = newTodo.id;
    Todo.findByPk.mockReturnValue(newTodo);
    await TodoController.getTodoById(req, res, next);
    expect(res.statusCode).toBe(200);
    expect(res._isEndCalled()).toBeTruthy();
    expect(res._getJSONData()).toStrictEqual(newTodo);
  });

  it("should return 404 when item doesn't exits", async () => {
    Todo.findByPk.mockReturnValue(null);
    await TodoController.getTodoById(req, res, next);
    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBeTruthy();
  });

  it('should handle errors in getTodoById', async () => {
    const errorMessage = { message: 'error finding todoModel' };
    const rejectedPromise = Promise.reject(errorMessage);
    Todo.findByPk.mockReturnValue(rejectedPromise);
    await TodoController.getTodoById(req, res, next);
    expect(next).toBeCalledWith(errorMessage);
  });
});
