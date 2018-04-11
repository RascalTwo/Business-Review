const fs = require('fs');
const path = require('path');

const mmm = require('mmmagic');
const passport = require('passport');
const CircularJSON = require('circular-json');

const { check, validationResult, oneOf } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

/**
 * Return a invalid length message.
 *
 * @param {String} name Name of the paramater.
 * @param {Number} min Minimum length.
 * @param {Number} max Maximum length.
 * @param {Boolean} [optional=undefined] If the param is optional.
 *
 * @returns {String}
 */
const invalidLengthMessage = (name, min, max, optional) => `'${name}' ${optional ? 'may only' : 'must'} be between ${min} and ${max} characters long`;

/**
 * Return a invalid paramater message.
 *
 * @param {String} name Name of the paramater.
 * @param {String} type Expected type of the paramater.
 * @param {Boolean} [optional=undefined] If the param is optional.
 *
 * @returns {String}
 */
const invalidParamMessage = (name, type, optional) => (optional ? `'${name}' must be a ${type}` : `'${name}' is a required ${type} paramater`);


/**
 * Express middleware to handle the result of validation.
 */
const handleValidation = (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    response.status(422).send({
      success: false,
      // Convert the object of errors into a string of the error messages seperated by new lines.
      message: [Object.values(errors.mapped()).reduce((message, object) => `${message}\n${object.msg}`, ''), 'error']
    });
    return;
  }

  response.locals.data = matchedData(request);
  next();
};


/**
 * Express middleware to ensure user is logged in.
 *
 * @param {String} [redirect=undefined] Path to redirect to if not logged in.
 * If not included, it is assumed this is an API and therefore an API response will be sent.
 */
const ensureLoggedIn = redirect => (request, response, next) => {
  if (request.isAuthenticated()) return next();

  if (!redirect) {
    return response.send({
      success: false,
      message: ['Unauthorized', 'error']
    });
  }

  if (redirect.includes('return=')) return response.redirect(redirect + encodeURIComponent(request.url));

  return response.redirect(redirect);
};


/**
 * Return a function to handle an error from an API endpoint.
 */
const handleAPIRejection = response => error => response.status(500).send({
  success: false,
  message: [error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : error.toString(), 'error']
});

module.exports = (Server) => {
  Server.app.get('/api', (_, response) => response.send({
    timestamp: Date.now()
  }));

  // Using this middleware to catch all requests that are non-API and redirect
  // them the index.html so the react-router can handle them.
  Server.app.use((request, response, next) => {
    const flag = /^\/api/.test(request.url);
    if (flag) return next();
    return Server.db.getBusinesses().then((businesses) => {
      const html = fs.readFileSync(path.join(Server.paths.root, 'build', 'index.html')).toString();
      response.send(html.replace(
        /(payload=false)|(payload=!1)/,
        `payload=${CircularJSON.stringify(businesses)}`
      ));
    }).catch(error => response.status(500).send(error));
  });

  // #region User

  Server.app.post('/api/login', (request, response, next) => passport.authenticate('local', (error, user) => {
    if (error) return next(error);
    if (!user) {
      return response.send({
        success: false,
        message: ['User account not found', 'error']
      });
    }

    return request.login(user, (err) => {
      if (err) return next(err);

      return response.send({
        success: true,
        message: ['Successfully logged in', 'success']
      });
    });
  })(request, response, next));

  Server.app.get('/api/logout', (request, response) => {
    request.logout();
    return response.send({
      success: true,
      message: ['Successfully logged out', 'success']
    });
  });

  Server.app.get('/api/user', ensureLoggedIn(), (request, response) => response.send({
    success: true,
    data: request.user
  }));

  Server.app.post(
    '/api/user',
    check('username', invalidParamMessage('username', 'string'))
      .exists().isString()
      .isLength({
        min: 5,
        max: 100
      })
      .withMessage(invalidLengthMessage('username', 5, 100)),
    check('password', invalidParamMessage('password', 'string'))
      .exists().isString()
      .isLength({
        min: 8,
        max: 100
      })
      .withMessage(invalidLengthMessage('password', 8, 100)),
    handleValidation,
    (request, response) => {
      const { username, password } = response.locals.data;
      return Server.db.addUser(username, password)
        .then((result) => {
          if (!result.success) return result;

          return new Promise((resolve, reject) => request.login(result.data, (error) => {
            if (error) return reject(error);
            return resolve(result);
          }));
        })
        .then(result => response.send(result))
        .catch(handleAPIRejection(response));
    }
  );

  // #endregion
  // #region Business


  Server.app.get('/api/businesses', (request, response) => Server.db.getBusinesses().then(businesses => response.send({
    success: true,
    message: [`${businesses.length} businesses fetched`, 'success'],
    cdata: CircularJSON.stringify(businesses)
  })).catch(handleAPIRejection(response)));


  Server.app.get('/api/business/:id', (request, response) => Server.db.getBusiness(Number(request.params.id))
    .then(result => response.send({
      success: result.success,
      message: result.message,
      cdata: CircularJSON.stringify(result.data)
    })).catch(handleAPIRejection(response)));


  Server.app.post(
    '/api/business',
    ensureLoggedIn(),
    check('name', invalidParamMessage('name', 'string'))
      .exists().isString().trim()
      .isLength({
        min: 4,
        max: 200
      })
      .withMessage(invalidLengthMessage('name', 4, 200)),
    check('type', invalidParamMessage('type', 'string'))
      .optional().isString().trim()
      .isLength({
        min: 5,
        max: 25
      })
      .withMessage(invalidLengthMessage('type', 5, 25)),
    check('address', invalidParamMessage('address', 'string'))
      .exists().isString().trim()
      .isLength({
        min: 4,
        max: 50
      })
      .withMessage(invalidLengthMessage('address', 4, 50)),
    check('city', invalidParamMessage('city', 'string'))
      .exists().isString().trim()
      .isLength({
        min: 3,
        max: 100
      })
      .withMessage(invalidLengthMessage('city', 3, 100)),
    check('state', invalidParamMessage('state', 'string'))
      .exists().isString().trim()
      .isLength({
        min: 2,
        max: 25
      })
      .withMessage(invalidLengthMessage('state', 2, 25)),
    check('postalCode', invalidParamMessage('postalCode', 'string'))
      .exists().isString().trim()
      .isLength({
        min: 3,
        max: 11
      })
      .withMessage(invalidLengthMessage('postalCode', 3, 11)),
    handleValidation,
    (request, response) => {
      // Using destructing over Object.values() in order to maintain order.
      const {
        name, type, address, city, state, postalCode
      } = response.locals.data;

      return Server.db.addBusiness(name, type, address, city, state, postalCode)
        .then(result => response.send(result))
        .catch(handleAPIRejection(response));
    }
  );


  Server.app.patch(
    '/api/business/:id',
    ensureLoggedIn(),
    oneOf([
      check('name', invalidParamMessage('name', 'string'))
        .exists().isString().trim()
        .isLength({
          min: 4,
          max: 200
        })
        .withMessage(invalidLengthMessage('name', 4, 200)),
      check('type', invalidParamMessage('type', 'string'))
        .exists(),
      check('address', invalidParamMessage('address', 'string'))
        .exists().isString().trim()
        .isLength({
          min: 4,
          max: 50
        })
        .withMessage(invalidLengthMessage('address', 4, 50)),
      check('city', invalidParamMessage('city', 'string'))
        .exists().isString().trim()
        .isLength({
          min: 3,
          max: 100
        })
        .withMessage(invalidLengthMessage('city', 3, 100)),
      check('state', invalidParamMessage('state', 'string'))
        .exists().isString().trim()
        .isLength({
          min: 2,
          max: 25
        })
        .withMessage(invalidLengthMessage('state', 2, 25)),
      check('postalCode', invalidParamMessage('postalCode', 'string'))
        .exists().isString().trim()
        .isLength({
          min: 3,
          max: 11
        })
        .withMessage(invalidLengthMessage('postalCode', 3, 11)),
      check('purchased', invalidParamMessage('purchased', 'boolean'))
        .exists().isBoolean()
    ], "At least one value must be supplied: 'name', 'type', 'address', 'city', 'state', 'postalCode', 'purchased'"),
    handleValidation,
    (request, response) => {
      // Since the type can be null to remove, it must be manually
      // be verified if it's not null.
      const { type } = response.locals.data;
      if (type && (type.length < 5 || type.length > 25)) {
        return response.status(422).send({
          success: false,
          message: [invalidLengthMessage('type', 5, 25), 'error']
        });
      }

      return Server.db.editEntity('Business', Number(request.params.id), response.locals.data)
        .then(result => response.send(result))
        .catch(handleAPIRejection(response));
    }
  );


  Server.app.delete('/api/business/:id', ensureLoggedIn(), (request, response) => Server.db.deleteBusiness(Number(request.params.id))
    .then(result => response.send(result))
    .catch(handleAPIRejection(response)));


  // #endregion
  // #region Review


  Server.app.get('/api/reviews', (request, response) => Server.db.getReviews().then(reviews => response.send({
    success: true,
    message: [`${reviews.length} reviews fetched`, 'success'],
    cdata: CircularJSON.stringify(reviews)
  })).catch(handleAPIRejection(response)));


  Server.app.get('/api/review/:id', (request, response) => Server.db.getReview(Number(request.params.id))
    .then(result => response.send({
      success: result.success,
      message: result.message,
      cdata: CircularJSON.stringify(result.data)
    }))
    .catch(handleAPIRejection(response)));


  Server.app.post(
    '/api/review',
    ensureLoggedIn(),
    check('businessId', invalidParamMessage('businessId', 'number'))
      .exists().isNumeric().toInt(),
    check('score', invalidParamMessage('score', 'number'))
      .exists().isNumeric().toInt()
      .isInt({ min: 0, max: 10 })
      .withMessage("'score' must have a value between 0 and 10"),
    check('text', invalidParamMessage('text', 'string'))
      .exists().isString().trim()
      .isLength({
        min: 25,
        max: 300
      })
      .withMessage(invalidLengthMessage('text', 25, 300)),
    handleValidation,
    (request, response) => {
      const { businessId, score, text } = response.locals.data;

      // TODO: Replace this user ID here with actual user ID.
      return Server.db.addReview(businessId, 1, score, text)
        .then(result => response.send(result))
        .catch(handleAPIRejection(response));
    }
  );


  Server.app.patch(
    '/api/review/:id',
    ensureLoggedIn(),
    oneOf([
      check('score', invalidParamMessage('score', 'number'))
        .exists().isNumeric().toInt()
        .isInt({ min: 0, max: 10 })
        .withMessage("'score' must have a value between 0 and 10"),
      check('text', invalidParamMessage('text', 'string'))
        .exists().isString().trim()
        .isLength({
          min: 25,
          max: 300
        })
        .withMessage(invalidLengthMessage('text', 25, 300))
    ], "At least one value must be supplied: 'score', 'text'"),
    handleValidation,
    (request, response) => Server.db.editEntity('Review', Number(request.params.id), response.locals.data)
      .then(result => response.send(result))
      .catch(handleAPIRejection(response))
  );


  Server.app.delete('/api/review/:id', ensureLoggedIn(), (request, response) => Server.db.deleteReview(Number(request.params.id))
    .then(result => response.send(result))
    .catch(handleAPIRejection(response)));


  // #endregion
  // #region Photo


  Server.app.post(
    '/api/photo',
    ensureLoggedIn(),
    Server.upload.single('file'),
    (request, response) => {
      const { file } = request;
      const { businessId, caption } = request.body;

      const errorMessages = [];
      if (!file) {
        errorMessages.push(invalidParamMessage('file', 'file'));
      }
      if (!businessId || Number.isNaN(Number(businessId))) {
        errorMessages.push(invalidParamMessage('businessId', 'number'));
      }
      if (!caption) {
        errorMessages.push(invalidParamMessage('caption', 'string'));
      }
      if (caption && (caption.length < 5 || caption.length > 100)) {
        errorMessages.push(invalidLengthMessage('caption', 5, 100));
      }

      if (errorMessages.length) {
        return response.send({
          success: false,
          message: [errorMessages.join('\n'), 'error']
        });
      }

      return new Promise((resolve, reject) => {
        if (file.size > 5000000) {
          return resolve({
            success: false,
            message: ['File size is too large', 'warn']
          });
        }

        if (!file.mimetype.startsWith('image')) {
          return resolve({
            success: false,
            message: ['Uploaded file has invalid extension', 'warn']
          });
        }

        return new mmm.Magic(mmm.MAGIC_MIME_TYPE).detect(file.buffer, (error, mimetype) => {
          if (error) return reject(error);

          const success = mimetype.startsWith('image');
          return resolve({
            success,
            message: success ? undefined : [`Expected mime-type of image but instead detected '${mimetype}'`, 'warn']
          });
        });
      }).then((mimeResult) => {
        if (!mimeResult.success) return response.send(mimeResult);

        return Server.db.uploadPhoto(Number(businessId), file.buffer, caption)
          .then(result => response.send(result))
          .catch(handleAPIRejection(response));
      }).catch(handleAPIRejection(response));
    }
  );


  // #endregion
};
