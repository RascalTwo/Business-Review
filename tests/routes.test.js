const fs = require('fs');

const fetch = require('node-fetch');
const Server = require('./../server.js')();

const baseUrl = 'http://localhost:5325/';

test('/', () => {
  const instance = new Server(5325);
  expect(fs.existsSync(`${instance.root}/build/index.html`)).toBeTruthy();

  return instance.init().then(() => instance.start())
    .then(() => fetch(baseUrl))
    .then((response) => {
      expect(response.status).toBe(200);
      return response.text();
    })
    .then((text) => {
      // Starts with DOCTYPE html tag and contains injected payload.
      expect(text).toMatch(/^<!DOCTYPE html>/g);
      expect(text).toMatch(/payload=\[/g);
    })
    .catch(fail)
    .then(() => instance.stop());
});

test('/api', () => {
  const instance = new Server(5325);

  let now = null;
  return instance.init().then(() => instance.start())
    .then(() => {
      now = Date.now();
      return fetch(`${baseUrl}api`);
    })
    .then((response) => {
      expect(response.status).toBe(200);
      return response.json();
    })
    .then((json) => {
      // Timestamp is within 1 second of when the request was made.
      expect(json).toBeInstanceOf(Object);
      expect(json).toHaveProperty('timestamp');
      expect(json.timestamp).toBeGreaterThanOrEqual(now - 1000);
      expect(json.timestamp).toBeLessThanOrEqual(now + 1000);
    })
    .catch(fail)
    .then(() => instance.stop());
});
