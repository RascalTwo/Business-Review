const path = require('path');
const Server = require('./../server.js')();

test('constructor()', () => {
  expect(() => new Server()).not.toThrow();
});

test('has default arguments', () => {
  const instance = new Server();
  expect(instance.paths).toEqual({
    root: path.resolve(__dirname, '..'),
    data: path.resolve(__dirname, '..', 'data'),
    photos: path.resolve(__dirname, '..', 'src', 'business_photos')
  });
  expect(instance.port).toBe(8080);
});

test('accepts arguments', () => {
  const instance = new Server(5325, {
    root: 'newroot',
    data: 'newdata',
    photos: 'newphotos'
  });
  expect(instance.paths).toEqual({
    root: path.resolve(__dirname, '..'),
    data: 'newdata',
    photos: 'newphotos'
  });
  expect(instance.port).toBe(5325);
});

describe('init()', () => {
  test('does not throw', () => new Server().init());

  test('initalizes database', () => new Server().init().then((instance) => {
    expect(instance.db.db).toHaveProperty('driver');
  }).catch(fail));
});

test('start and stop do not throw', () => new Server().init()
  .then(instance => instance.start())
  .then(instance => instance.stop())
  .catch(fail), 1000);

test('throws when start without init', () => {
  new Server().start().then(fail).catch((error) => {
    expect(error).toEqual(new Error('Must initalize server before starting'));
  });
});

test('does nothing when stop before start', () => {
  new Server().stop().catch(fail);
});
