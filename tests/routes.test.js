const fs = require('fs');

const fetch = require('node-fetch');
const FormData = require('form-data');
const CircularJSON = require('circular-json');
const Server = require('./../server.js')();

const mockData = require('./../mock_data/mock-data.js')();

const baseUrl = 'http://localhost:5325';

// #region Helper Functions

/**
 * Parse error message to <param-message} object map.
 *
 * @param {String} message;
 *
 * @returns {Object}
 */
const parseErrorMessage = message => message.split('\n').filter(line => line).reduce((params, line) => Object.assign(params, {
  [line.match(/'(.*)'/)[1]]: line
}), {});

/**
 * Parse the contents of text within single-quotes.
 *
 * @param {String} string String to parse.
 *
 * @returns {Array<String>} Array of single-quote contents.
 */
const parseQuotes = string => string.match(/('.*?')/g).map(word => word.slice(1, -1));


/**
 * Startup the server, run the provided promise, and catch all errors.
 *
 * @param {Function<Promise>} next Actual test code
 */
const startupServer = next => () => {
  if (fs.existsSync(`${__dirname}/data/database.db`)) fs.unlinkSync(`${__dirname}/data/database.db`);

  // Construct and then start the server, next return the result of the
  // next callback, then catch the error, stop the server,
  // and fail if there was an error.
  return new Server(5325, {
    data: `${__dirname}/data`,
    photos: `${__dirname}/business_photos`
  }).init()
    .then(instance => instance.start())
    .then(instance => next(instance)
      .catch(error => error)
      .then(error => instance.stop().then(() => {
        if (error) fail(error);
      })));
};


/**
 * Make a fetch request to an API, expecting JSON.
 *
 * @param {String} path Path to make request to.
 * @param {Object} [options={}] Options for the request.
 * @param {Object} [data=undefined] Data to encode for the body.
 *
 * @returns {Promise<{json: Object, response: Response, text?: String}>} Response and JSON data.
 */
function fetchAPI(path, options = {}, data) {
  let isJSON = true;
  let response = null;

  const headers = options.headers ? Object.assign({}, {
    'content-type': 'application/json'
  }, options.headers) : {
    'content-type': 'application/json'
  };

  Object.assign(options, { headers }, data ? {
    body: JSON.stringify(data)
  } : null);

  return fetch(baseUrl + path, options).then((receivedResponse) => {
    response = receivedResponse;

    if (!receivedResponse.headers.get('content-type').toLowerCase().includes('application/json')) {
      isJSON = false;
      return receivedResponse.text();
    }
    return receivedResponse.json();
  }).then((json) => {
    if (!isJSON) {
      fail(json);
      return { text: json, response };
    }
    expect(json).toBeInstanceOf(Object);

    expect(json).toHaveProperty('success');
    expect(typeof json.success).toBe('boolean');

    if (json.message) expect(Array.isArray(json.message)).toBeTruthy();

    return { json, response };
  });
}


/**
 * Login to the server.
 *
 * @returns {Promise<Object>} Headers for next requests.
 */
async function login() {
  const data = {
    username: 'testuser',
    password: 'testpassword'
  };

  let { json, response } = await fetchAPI('/api/login', { method: 'POST' }, data);

  if (json.success) {
    return {
      cookie: response.headers.get('set-cookie')
    };
  }

  ({ json, response } = await fetchAPI('/api/user', { method: 'POST' }, data));

  if (json.success) {
    return {
      cookie: response.headers.get('set-cookie')
    };
  }

  return Promise.reject(json);
}


/**
 * Test an API paramaters range and type restrictions.
 *
 * @param {String} path API endpoint path.
 * @param {String} method HTTP method for API path.
 * @param {String} param Name of param to test.
 * @param {String} type Type of param.
 * @param {any} value Value of paramater that will be successful.
 * @param {Number} [min=undefined] Minimum length/value of param.
 * @param {Number} [max=undefined] Maximum length/value of param.
 */
function testAPIParamRangeAndType(path, method, param, type, value, min, max) {
  const postValue = value;
  let minMaxData;

  // Generate min, max, and passing values for string and numeric param types.
  if (type === 'string') {
    minMaxData = ['S', 'S'.repeat(max + 1), 'S'.repeat(min)];
  } else if (type === 'number') {
    minMaxData = [min - 1, max + 1, min];
  }

  describe(param, () => {
    test(`type enforced to ${type}`, startupServer(async () => {
      const headers = await login();

      const { json } = await fetchAPI(path, { method, headers }, { [param]: postValue });
      const messages = parseErrorMessage(json.message[0]);

      // Error message for this paramater does not exist.
      expect(messages[param]).toBeUndefined();
    }));

    if (min === undefined && max === undefined) return;

    test(`length enforced to between ${min} and ${max}`, startupServer(async () => {
      const headers = await login();

      let { json } = await fetchAPI(path, { method, headers }, { [param]: minMaxData[0] });
      let messages = parseErrorMessage(json.message[0]);

      // Error received when value is below min.
      expect(messages[param].includes(`${min} and ${max}`)).toBeTruthy();

      ({ json } = await fetchAPI(path, { method, headers }, { [param]: minMaxData[1] }));
      messages = parseErrorMessage(json.message[0]);

      // Error received when value is above max.
      expect(messages[param].includes(`${min} and ${max}`)).toBeTruthy();

      ({ json } = await fetchAPI(path, { method, headers }, { [param]: minMaxData[2] }));
      messages = parseErrorMessage(json.message[0]);

      // Error does not exist when value is correct.
      expect(messages[param]).toBeUndefined();
    }));
  });
}


/**
 * Test tnat a route requires user authentication.
 *
 * @param {String} path Path of the route.
 * @param {String} method Method of the route.
 */
function testAPILoginRequired(path, method) {
  test('login required', startupServer(async () => {
    let { json } = await fetchAPI(path, { method });
    expect(json.message[0]).toBe('Unauthorized');

    const headers = await login();

    ({ json } = await fetchAPI(path, { method, headers }));
    expect(json.message[0]).not.toBe('Unauthorized');
  }));
}

// #endregion

describe('/api/photo', () => {
  describe('POST', () => {
    test('image size must be less then 5 MB', startupServer(async (instance) => {
      await mockData(`${instance.paths.data}/database.db`);

      const headers = await login();

      const formData = new FormData();
      formData.append('file', fs.createReadStream(`${__dirname}/large_image.jpg`));
      formData.append('businessId', '1');
      formData.append('caption', 'test caption');

      const { json } = await fetchAPI('/api/photo', {
        method: 'POST',
        headers: formData.getHeaders(headers),
        body: formData
      });

      expect(json.success).toBe(false);
      expect(json.message[0]).toBe('File size is too large');
    }));

    test('works', startupServer(async (instance) => {
      await mockData(`${instance.paths.data}/database.db`);

      const headers = await login();

      const formData = new FormData();
      formData.append('file', fs.createReadStream(`${__dirname}/../public/favicon.ico`));
      formData.append('businessId', '1');
      formData.append('caption', 'test caption');

      const { json } = await fetchAPI('/api/photo', {
        method: 'POST',
        headers: formData.getHeaders(headers),
        body: formData
      });

      expect(json.success).toBe(true);
      expect(fs.existsSync(`${instance.paths.photos}/${json.data.id}.jpg`)).toBe(true);

      const orig = fs.readFileSync(`${__dirname}/../public/favicon.ico`).toString();
      const uploaded = fs.readFileSync(`${instance.paths.photos}/${json.data.id}.jpg`).toString();
      expect(uploaded).toBe(orig);

      const found = await instance.db.db.get('SELECT * FROM photo WHERE id = ?', json.data.id);
      expect(found).toEqual(json.data);
    }));
  });
});

test('/', startupServer(async (instance) => {
  expect(fs.existsSync(`${instance.root}/build/index.html`)).toBeTruthy();

  await mockData(`${instance.paths.data}/database.db`);

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


describe('authentication', () => {
  describe('/api/user', () => {
    describe('GET & POST', () => {
      test('', startupServer(async () => {
        const headers = await login();

        const { json } = await fetchAPI('/api/user', { headers });

        expect(json.success).toBe(true);
        expect(json.data.id).toBe(1);
      }));
    });
  });
  describe('/api/login', () => {
    describe('POST', () => {
      test('', startupServer(async () => {
        // Creates test user
        await login();

        const headers = await login();

        const { json } = await fetchAPI('/api/user', { headers });

        expect(json.success).toBe(true);
      }));
    });
  });
  describe('/api/logout', () => {
    describe('GET', () => {
      test('', startupServer(async () => {
        const headers = await login();

        let { json } = await fetchAPI('/api/user', { headers });
        expect(json.success).toBe(true);

        ({ json } = await fetchAPI('/api/logout', { headers }));
        expect(json.success).toBe(true);
      }));
    });
  });
});


describe('/api/business', () => {
  describe('/api/businesses', () => {
    describe('GET', () => {
      test('', startupServer(async (instance) => {
        await mockData(`${instance.paths.data}/database.db`);

        const { json } = await fetchAPI('/api/businesses');

        expect(json.success).toBe(true);
        expect(json).toHaveProperty('cdata');

        const cdata = CircularJSON.parse(json.cdata);

        expect(cdata.length).toBe(2);

        cdata.forEach((business) => {
          expect(business.reviews.length).not.toBe(0);
          expect(business.photos.length).not.toBe(0);
        });
      }));
    });
  });

  describe('/api/business/:id', () => {
    describe('GET', () => {
      test('', startupServer(async (instance) => {
        await mockData(`${instance.paths.data}/database.db`);

        const { json } = await fetchAPI('/api/business/1');

        expect(json.success).toBe(true);
        expect(json).toHaveProperty('cdata');

        const cdata = CircularJSON.parse(json.cdata);

        expect(cdata.reviews.length).not.toBe(0);
        expect(cdata.photos.length).not.toBe(0);
      }));
    });

    describe('PATCH', () => {
      const apiPath = '/api/business';
      testAPILoginRequired(`${apiPath}/1`, 'PATCH');

      test('required paramaters listed', startupServer(async () => {
        const headers = await login();

        const { json } = await fetchAPI(`${apiPath}/1`, { method: 'PATCH', headers });
        expect(json.success).toBe(false);

        expect(json.message[0].includes('At least one value must be supplied: ')).toBe(true);

        expect(parseQuotes(json.message[0])).toEqual(['name', 'type', 'address', 'city', 'state', 'postalCode', 'purchased']);
      }));

      test('updates', startupServer(async (instance) => {
        const headers = await login();

        const expected = {
          name: 'Testing',
          address: '1234 test st.',
          city: 'testville',
          state: 'TS',
          postalCode: '53253'
        };

        await fetchAPI('/api/business', { method: 'POST', headers }, expected);

        const changes = {
          type: 'new type',
          name: 'New testing',
          purchased: true
        };

        let { json } = await fetchAPI(apiPath, { method: 'POST', headers }, expected);

        const { id } = json.data;

        ({ json } = await fetchAPI(`${apiPath}/${id}`, { method: 'PATCH', headers }, changes));

        expect(json.success).toBe(true);

        const fullExpected = Object.assign(expected, changes, {
          id: 1,
          purchased: 1
        });

        expect(json.data).toEqual(fullExpected);

        const found = await instance.db.db.get('SELECT * FROM business WHERE id = ?', id);
        expect(found).toEqual(fullExpected);
      }));

      test('can nullify properties', startupServer(async (instance) => {
        const headers = await login();

        const expected = {
          name: 'Testing',
          type: 'real type',
          address: '1234 test st.',
          city: 'testville',
          state: 'TS',
          postalCode: '53253'
        };

        await fetchAPI('/api/business', { method: 'POST', headers }, expected);

        const changes = {
          type: null
        };

        let { json } = await fetchAPI(apiPath, { method: 'POST', headers }, expected);

        const { id } = json.data;

        ({ json } = await fetchAPI(`${apiPath}/${id}`, { method: 'PATCH', headers }, changes));

        expect(json.success).toBe(true);

        const fullExpected = Object.assign(expected, changes, {
          id: 1,
          purchased: null
        });

        expect(json.data).toEqual(fullExpected);

        const found = await instance.db.db.get('SELECT * FROM business WHERE id = ?', id);
        expect(found).toEqual(fullExpected);
      }));

      test('does not update when data matches', startupServer(async () => {
        const headers = await login();

        const expected = {
          name: 'Testing',
          address: '1234 test st.',
          city: 'testville',
          state: 'TS',
          postalCode: '53253'
        };

        await fetchAPI('/api/business', { method: 'POST', headers }, expected);

        const changes = {
          type: null,
          city: 'testville',
        };

        let { json } = await fetchAPI(apiPath, { method: 'POST', headers }, expected);

        const { id } = json.data;

        ({ json } = await fetchAPI(`${apiPath}/${id}`, { method: 'PATCH', headers }, changes));

        expect(json.success).toBe(false);
      }));

      test('fails when business does not exist', startupServer(async () => {
        const headers = await login();

        const { json } = await fetchAPI(`${apiPath}/9000`, { method: 'PATCH', headers }, {
          name: 'bobby'
        });

        expect(json.success).toBe(false);

        expect(json.message[0]).toBe('Business not found');
      }));
    });

    describe('DELETE', () => {
      const apiPath = '/api/business';
      testAPILoginRequired(`${apiPath}/1`, 'DELETE');

      test('deletes business and related entities', startupServer(async (instance) => {
        const headers = await login();

        await mockData(`${instance.paths.data}/database.db`);

        const { json } = await fetchAPI(`${apiPath}/1`, { method: 'DELETE', headers });

        expect(json.success).toBe(true);

        let found = await instance.db.db.get('SELECT * FROM business WHERE id = ?', 1);
        expect(found).toBeUndefined();

        found = await instance.db.db.all('SELECT * FROM review WHERE businessId = ?', 1);
        expect(found.length).toBe(0);

        found = await instance.db.db.all('SELECT * FROM photo WHERE businessId = ?', 1);
        expect(found.length).toBe(0);
      }));


      test('fails when business does not exist', startupServer(async () => {
        const headers = await login();

        const { json } = await fetchAPI(`${apiPath}/9000`, { method: 'DELETE', headers });

        expect(json.success).toBe(false);
      }));
    });
  });

  describe('/api/business', () => {
    describe('POST', () => {
      const apiPath = '/api/business';
      testAPILoginRequired(apiPath, 'POST');

      test('required paramaters listed', startupServer(async () => {
        const headers = await login();

        const { json } = await fetchAPI(apiPath, { method: 'POST', headers });
        const messages = parseErrorMessage(json.message[0]);

        expect(Object.keys(messages)).toEqual(['name', 'address', 'city', 'state', 'postalCode']);
      }));

      testAPIParamRangeAndType(apiPath, 'POST', 'name', 'string', 'Name', 4, 200);
      testAPIParamRangeAndType(apiPath, 'POST', 'type', 'string', 'ValidType', 5, 25);
      testAPIParamRangeAndType(apiPath, 'POST', 'address', 'string', 'Address', 4, 50);
      testAPIParamRangeAndType(apiPath, 'POST', 'city', 'string', 'City', 3, 100);
      testAPIParamRangeAndType(apiPath, 'POST', 'state', 'string', 'NY', 2, 25);
      testAPIParamRangeAndType(apiPath, 'POST', 'postalCode', 'string', '508', 3, 11);

      test('is usable', startupServer(async () => {
        const headers = await login();

        const expected = {
          name: 'Testing',
          type: 'test place',
          address: '1234 test st.',
          city: 'testville',
          state: 'TS',
          postalCode: '53253'
        };
        const { json } = await fetchAPI(apiPath, { method: 'POST', headers }, expected);

        expect(json.success).toBe(true);
        expect(json.data).toEqual(Object.assign({
          id: 1,
          purchased: false
        }, expected));
      }));

      test('type is optional', startupServer(async () => {
        const headers = await login();

        const expected = {
          name: 'Testing',
          address: '1234 test st.',
          city: 'testville',
          state: 'TS',
          postalCode: '53253'
        };
        const { json } = await fetchAPI(apiPath, { method: 'POST', headers }, expected);

        expect(json.success).toBe(true);
        expect(json.data).toEqual(Object.assign({
          id: 1,
          purchased: false
        }, expected));
      }));

      test('duplicates are prevented', startupServer(async () => {
        const headers = await login();

        const expected = {
          name: 'Testing',
          type: 'duplicate',
          address: '1234 test st.',
          city: 'testville',
          state: 'TS',
          postalCode: '53253'
        };
        let { json } = await fetchAPI(apiPath, { method: 'POST', headers }, expected);

        expect(json.success).toBe(true);
        expect(json.data).toEqual(Object.assign({
          id: 1,
          purchased: false
        }, expected));

        ({ json } = await fetchAPI(apiPath, { method: 'POST', headers }, expected));

        expect(json.success).toBe(false);
        expect(json.data).toEqual(Object.assign({
          id: 1,
          purchased: false
        }, expected));
      }));
    });
  });
});


describe('/api/review', () => {
  describe('/api/reviews', () => {
    describe('GET', () => {
      test('', startupServer(async (instance) => {
        await mockData(`${instance.paths.data}/database.db`);

        const { json } = await fetchAPI('/api/reviews');

        expect(json.success).toBe(true);
        expect(json).toHaveProperty('cdata');

        const cdata = CircularJSON.parse(json.cdata);

        expect(cdata.length).toBe(3);

        cdata.forEach((review) => {
          expect(review.business).toBeInstanceOf(Object);
          expect(review.user).toBeInstanceOf(Object);
        });
      }));
    });
  });

  describe('/api/review/:id', () => {
    describe('GET', () => {
      test('', startupServer(async (instance) => {
        mockData(`${instance.paths.data}/database.db`);

        const { json } = await fetchAPI('/api/review/1');

        expect(json.success).toBe(true);
        expect(json).toHaveProperty('cdata');

        const cdata = CircularJSON.parse(json.cdata);

        expect(cdata.business).toBeInstanceOf(Object);
        expect(cdata.user).toBeInstanceOf(Object);
      }));
    });

    describe('PATCH', () => {
      const apiPath = '/api/review';
      testAPILoginRequired(`${apiPath}/1`, 'PATCH');

      test('required paramaters listed', startupServer(async () => {
        const headers = await login();

        const { json } = await fetchAPI(`${apiPath}/1`, { method: 'PATCH', headers });

        expect(json.success).toBe(false);

        expect(json.message[0].includes('At least one value must be supplied: ')).toBe(true);

        expect(parseQuotes(json.message[0])).toEqual(['score', 'text']);
      }));

      test('updates', startupServer(async (instance) => {
        const headers = await login();

        await fetchAPI('/api/business', { method: 'POST', headers }, {
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

        const changes = {
          score: 10,
          text: 'This is long enough for update text passing the limit'
        };

        let { json } = await fetchAPI(apiPath, { method: 'POST', headers }, expected);

        const { id } = json.data;

        const now = Date.now();

        const verifyResult = (actualParam, expectedResult) => {
          const actual = Object.assign({}, actualParam);
          const when = actual.date;
          delete actual.date;

          expect(when).toBeGreaterThanOrEqual(now - 1000);
          expect(when).toBeLessThanOrEqual(now + 1000);

          expect(actual).toEqual(expectedResult);
        };

        ({ json } = await fetchAPI(`${apiPath}/${id}`, { method: 'PATCH', headers }, changes));

        expect(json.success).toBe(true);

        const fullExpected = Object.assign(expected, changes, {
          id
        });

        verifyResult(json.data, fullExpected);

        const found = await instance.db.db.get('SELECT * FROM review WHERE id = ?', id);

        verifyResult(found, fullExpected);
      }));

      test('does not update when data matches', startupServer(async () => {
        const headers = await login();

        await fetchAPI('/api/business', { method: 'POST', headers }, {
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

        const changes = {
          score: 5,
        };

        let { json } = await fetchAPI(apiPath, { method: 'POST', headers }, expected);

        const { id } = json.data;

        ({ json } = await fetchAPI(`${apiPath}/${id}`, { method: 'PATCH', headers }, changes));

        expect(json.success).toBe(false);
      }));

      test('fails when review does not exist', startupServer(async () => {
        const headers = await login();

        const { json } = await fetchAPI(`${apiPath}/9000`, { method: 'PATCH', headers }, {
          score: 10
        });

        expect(json.success).toBe(false);

        expect(json.message[0]).toBe('Review not found');
      }));
    });

    describe('DELETE', () => {
      const apiPath = '/api/review';
      testAPILoginRequired(`${apiPath}/1`, 'DELETE');

      test('deletes', startupServer(async (instance) => {
        const headers = await login();

        await fetchAPI('/api/business', { method: 'POST', headers }, {
          name: 'Testing',
          address: '1234 test st.',
          city: 'testville',
          state: 'TS',
          postalCode: '53253'
        });

        let { json } = await fetchAPI(apiPath, { method: 'POST', headers }, {
          businessId: 1,
          userId: 1,
          score: 5,
          text: 'This should be enough for the minimum limit'
        });

        const { id } = json.data;

        ({ json } = await fetchAPI(`${apiPath}/${id}`, { method: 'DELETE', headers }));

        expect(json.success).toBe(true);

        const found = await instance.db.db.get('SELECT * FROM review WHERE id = ?', id);

        expect(found).toBeUndefined();
      }));


      test('fails when review does not exist', startupServer(async () => {
        const headers = await login();

        const { json } = await fetchAPI(`${apiPath}/9000`, { method: 'DELETE', headers });

        expect(json.success).toBe(false);
      }));
    });
  });

  describe('/api/review', () => {
    describe('POST', () => {
      const apiPath = '/api/review';
      testAPILoginRequired(apiPath, 'POST');

      test('required paramaters listed', startupServer(async () => {
        const headers = await login();

        const { json } = await fetchAPI(apiPath, { method: 'POST', headers });
        const messages = parseErrorMessage(json.message[0]);

        expect(Object.keys(messages)).toEqual(['businessId', 'score', 'text']);
      }));

      testAPIParamRangeAndType(apiPath, 'POST', 'businessId', 'number', 1);
      testAPIParamRangeAndType(apiPath, 'POST', 'score', 'number', 5, 0, 10);
      testAPIParamRangeAndType(apiPath, 'POST', 'text', 'string', 'This is just about 25 letters', 25, 300);


      test('business must exist', startupServer(async () => {
        const headers = await login();

        const expected = {
          businessId: 9000,
          userId: 1,
          score: 5,
          text: 'This should be enough for the minimum limit'
        };
        const { json } = await fetchAPI(apiPath, { method: 'POST', headers }, expected);

        expect(json.success).toBe(false);
      }));

      test('is usable', startupServer(async () => {
        const headers = await login();

        await fetchAPI('/api/business', { method: 'POST', headers }, {
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
        const { json } = await fetchAPI(apiPath, { method: 'POST', headers }, expected);

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
  });
});

describe('/api/photo', () => {
  const apiPath = '/api/photo';
  testAPILoginRequired(apiPath, 'POST');

  describe('POST', () => {
    test('required paramaters listed', startupServer(async () => {
      const headers = await login();

      const { json } = await fetchAPI('/api/photo', { method: 'POST', headers });

      const messages = parseErrorMessage(json.message[0]);
      expect(Object.keys(messages)).toEqual(['file', 'businessId', 'caption']);
    }));

    test('filename must have image extension', startupServer(async () => {
      const headers = await login();

      const formData = new FormData();
      formData.append('file', fs.createReadStream(__filename));
      formData.append('businessId', '1');
      formData.append('caption', 'test caption');

      const { json } = await fetchAPI('/api/photo', {
        method: 'POST',
        headers: formData.getHeaders(headers),
        body: formData
      });

      expect(json.success).toBe(false);
      expect(json.message[0].includes('invalid extension')).toBe(true);
    }));

    test('file must actually be an image', startupServer(async () => {
      if (!fs.existsSync(`${__dirname}/fake_image.jpg`)) {
        const buffer = fs.readFileSync(__filename);
        fs.writeFileSync(`${__dirname}/fake_image.jpg`, buffer);
      }

      const headers = await login();

      const formData = new FormData();
      formData.append('file', fs.createReadStream(`${__dirname}/fake_image.jpg`));
      formData.append('businessId', '1');
      formData.append('caption', 'test caption');

      const { json } = await fetchAPI('/api/photo', {
        method: 'POST',
        headers: formData.getHeaders(headers),
        body: formData
      });

      expect(json.success).toBe(false);
      expect(json.message[0].includes("instead detected 'text/plain'")).toBe(true);
    }));

    test('business must exist', startupServer(async () => {
      const headers = await login();

      const formData = new FormData();
      formData.append('file', fs.createReadStream(`${__dirname}/../public/favicon.ico`));
      formData.append('businessId', '1');
      formData.append('caption', 'test caption');

      const { json } = await fetchAPI('/api/photo', {
        method: 'POST',
        headers: formData.getHeaders(headers),
        body: formData
      });

      expect(json.success).toBe(false);
      expect(json.message[0]).toBe('Business not found');
    }));
  });
});
