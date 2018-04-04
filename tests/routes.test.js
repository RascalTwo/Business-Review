const fs = require('fs');

const fetch = require('node-fetch');
const Server = require('./../server.js')();

const mockData = require('./../mock_data/mock-data.js')();

const baseUrl = 'http://localhost:5325';

/**
 * Startup the server, run the provided promise, and catch all errors.
 *
 * @param {Function<Promise>} next Actual test code
 */
const startupServer = next => () => {
  fs.unlinkSync(`${__dirname}/data/database.db`);

  return new Server(5325, { data: `${__dirname}/data` }).init()
    .then(instance => instance.start())
    .then(instance => next(instance)
      .catch(error => error)
      .then(error => instance.stop().then(() => {
        if (error) fail(error);
      })));
};

/**
 * Parse error message to <param-message} object map.
 *
 * @param {String} message;
 *
 * @returns {Object}
 */
const parseErrorMessage = message => message.split('\n').slice(1).reduce((params, line) => Object.assign(params, {
  [line.match(/'(.*)'/)[1]]: line
}), {});


/**
 * Make a fetch POST request to an API, expecting JSON.
 *
 * @param {String} path Path to make request to.
 * @param {any} data JSON data to encode.
 * @param {String} [method='POST'] Method to make request with.
 *
 * @returns {Promise<Object>} API Response.
 */
function fetchAPI(path, data, method = 'POST') {
  return fetch(
    baseUrl + path,
    Object.assign({ method }, data ? {
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(data)
    } : null)
  ).then(response => response.json()).then((json) => {
    expect(json).toBeInstanceOf(Object);

    expect(json).toHaveProperty('success');
    expect(typeof json.success).toBe('boolean');

    expect(json).toHaveProperty('message');
    expect(Array.isArray(json.message)).toBeTruthy();

    return json;
  });
}


/**
 * Test an API paramaters range and type restrictions.
 *
 * @param {String} path API endpoint path.
 * @param {String} param Name of param to test.
 * @param {String} type Type of param.
 * @param {any} value Value of paramater that will be successful.
 * @param {Number} [min=undefined] Minimum length/value of param.
 * @param {Number} [max=undefined] Maximum length/value of param.
 */
function testAPIParamRangeAndType(path, param, type, value, min, max) {
  const postValue = value;
  let minMaxData;
  if (type === 'string') {
    minMaxData = ['S', 'S'.repeat(max + 1), 'S'.repeat(min)];
  } else if (type === 'number') {
    minMaxData = [min - 1, max + 1, min];
  }

  describe(param, () => {
    test(`type enforced to ${type}`, startupServer(async () => {
      const json = await fetchAPI(path, { [param]: postValue });
      const messages = parseErrorMessage(json.message[0]);

      expect(messages[param]).toBeUndefined();
    }));

    if (min === undefined && max === undefined) return;

    test(`length enforced to between ${min} and ${max}`, startupServer(async () => {
      let json = await fetchAPI(path, { [param]: minMaxData[0] });
      let messages = parseErrorMessage(json.message[0]);

      expect(messages[param].includes(`${min} and ${max}`)).toBeTruthy();

      json = await fetchAPI(path, { [param]: minMaxData[1] });
      messages = parseErrorMessage(json.message[0]);

      expect(messages[param].includes(`${min} and ${max}`)).toBeTruthy();

      json = await fetchAPI(path, { [param]: minMaxData[2] });
      messages = parseErrorMessage(json.message[0]);

      expect(messages[param]).toBeUndefined();
    }));
  });
}


test('/', startupServer(async (instance) => {
  expect(fs.existsSync(`${instance.root}/build/index.html`)).toBeTruthy();

  mockData(`${instance.paths.data}/database.db`);

  return fetch(baseUrl).then((response) => {
    expect(response.status).toBe(200);
    return response.text();
  }).then((text) => {
    // Starts with DOCTYPE html tag and contains injected payload.
    expect(text).toMatch(/^<!DOCTYPE html>/g);
    expect(text).toMatch(/payload=\[/g);
  }).catch(fail);
}));


test('/api', startupServer(() => {
  const now = Date.now();
  return fetch(`${baseUrl}/api`).then((response) => {
    expect(response.status).toBe(200);
    return response.json();
  }).then((json) => {
    // Timestamp is within 1 second of when the request was made.
    expect(json).toBeInstanceOf(Object);
    expect(json).toHaveProperty('timestamp');
    expect(json.timestamp).toBeGreaterThanOrEqual(now - 1000);
    expect(json.timestamp).toBeLessThanOrEqual(now + 1000);
  }).catch(fail);
}));


describe('POST /api/business', () => {
  const apiPath = '/api/business';
  test('required paramaters listed', startupServer(async () => {
    const json = await fetchAPI(apiPath);
    const messages = parseErrorMessage(json.message[0]);

    expect(Object.keys(messages)).toEqual(['name', 'address', 'city', 'state', 'postalCode']);
  }));

  testAPIParamRangeAndType(apiPath, 'name', 'string', 'Name', 4, 200);
  testAPIParamRangeAndType(apiPath, 'type', 'string', 'ValidType', 5, 25);
  testAPIParamRangeAndType(apiPath, 'address', 'string', 'Address', 4, 50);
  testAPIParamRangeAndType(apiPath, 'city', 'string', 'City', 3, 100);
  testAPIParamRangeAndType(apiPath, 'state', 'string', 'NY', 2, 25);
  testAPIParamRangeAndType(apiPath, 'postalCode', 'string', '508', 3, 11);

  test('is usable', startupServer(async () => {
    const expected = {
      name: 'Testing',
      type: 'test place',
      address: '1234 test st.',
      city: 'testville',
      state: 'TS',
      postalCode: '53253'
    };
    const json = await fetchAPI(apiPath, expected);

    expect(json.success).toBe(true);
    expect(json.data).toEqual(Object.assign({
      id: 1,
      purchased: false
    }, expected));
  }));

  test('type is optional', startupServer(async () => {
    const expected = {
      name: 'Testing',
      address: '1234 test st.',
      city: 'testville',
      state: 'TS',
      postalCode: '53253'
    };
    const json = await fetchAPI(apiPath, expected);

    expect(json.success).toBe(true);
    expect(json.data).toEqual(Object.assign({
      id: 1,
      purchased: false
    }, expected));
  }));

  test('duplicates are prevented', startupServer(async () => {
    const expected = {
      name: 'Testing',
      type: 'duplicate',
      address: '1234 test st.',
      city: 'testville',
      state: 'TS',
      postalCode: '53253'
    };
    let json = await fetchAPI(apiPath, expected);

    expect(json.success).toBe(true);
    expect(json.data).toEqual(Object.assign({
      id: 1,
      purchased: false
    }, expected));

    json = await fetchAPI(apiPath, expected);

    expect(json.success).toBe(false);
    expect(json.data).toEqual(Object.assign({
      id: 1,
      purchased: false
    }, expected));
  }));
});

describe('DELETE /api/business/:id', () => {
  const apiPath = '/api/business';
  test('deletes business and related entities', startupServer(async (instance) => {
    mockData(`${instance.paths.data}/database.db`);

    const json = await fetchAPI(`${apiPath}/1`, null, 'DELETE');

    expect(json.success).toBe(true);

    let found = await instance.db.db.get('SELECT * FROM business WHERE id = ?', 1);
    expect(found).toBeUndefined();

    found = await instance.db.db.all('SELECT * FROM review WHERE businessId = ?', 1);
    expect(found.length).toBe(0);

    found = await instance.db.db.all('SELECT * FROM photo WHERE businessId = ?', 1);
    expect(found.length).toBe(0);
  }));


  test('fails when business does not exist', startupServer(async () => {
    const json = await fetchAPI(`${apiPath}/9000`, null, 'DELETE');

    expect(json.success).toBe(false);
  }));
});

describe('POST /api/review', () => {
  const apiPath = '/api/review';
  test('required paramaters listed', startupServer(async () => {
    const json = await fetchAPI(apiPath, undefined);
    const messages = parseErrorMessage(json.message[0]);

    expect(Object.keys(messages)).toEqual(['businessId', 'score', 'text']);
  }));

  testAPIParamRangeAndType(apiPath, 'businessId', 'number', 1);
  testAPIParamRangeAndType(apiPath, 'score', 'number', 5, 0, 10);
  testAPIParamRangeAndType(apiPath, 'text', 'string', 'This is just about 25 letters', 25, 300);


  test('business must exist', startupServer(async () => {
    const expected = {
      businessId: 9000,
      userId: 1,
      score: 5,
      text: 'This should be enough for the minimum limit'
    };
    const json = await fetchAPI(apiPath, expected);

    expect(json.success).toBe(false);
  }));

  test('is usable', startupServer(async () => {
    await fetchAPI('/api/business', {
      name: 'Testing',
      address: '1234 test st.',
      city: 'testville',
      state: 'TS',
      postalCode: '53253'
    });

    const expected = {
      businessId: 1,
      userId: 1,
      score: 5,
      text: 'This should be enough for the minimum limit'
    };
    const now = Date.now();
    const json = await fetchAPI(apiPath, expected);

    expect(json.success).toBe(true);

    const when = json.data.date;
    delete json.data.date;

    expect(json.data).toEqual(Object.assign({
      id: 1,
    }, expected));

    expect(when).toBeGreaterThanOrEqual(now - 1000);
    expect(when).toBeLessThanOrEqual(now + 1000);
  }));
});


describe('DELETE /api/review/:id', () => {
  const apiPath = '/api/review';
  test('deletes', startupServer(async (instance) => {
    await fetchAPI('/api/business', {
      name: 'Testing',
      address: '1234 test st.',
      city: 'testville',
      state: 'TS',
      postalCode: '53253'
    });

    let json = await fetchAPI(apiPath, {
      businessId: 1,
      userId: 1,
      score: 5,
      text: 'This should be enough for the minimum limit'
    });

    const { id } = json.data;

    json = await fetchAPI(`${apiPath}/${id}`, null, 'DELETE');

    expect(json.success).toBe(true);

    const found = await instance.db.db.get('SELECT * FROM review WHERE id = ?', id);

    expect(found).toBeUndefined();
  }));


  test('fails when review does not exist', startupServer(async () => {
    const json = await fetchAPI(`${apiPath}/9000`, null, 'DELETE');

    expect(json.success).toBe(false);
  }));
});
