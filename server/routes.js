const fs = require('fs');
const path = require('path');

const CircularJSON = require('circular-json');

const { check, validationResult } = require('express-validator/check');
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
      message: [Object.values(errors.mapped()).reduce((message, object) => `${message}\n${object.msg}`, ''), 'error']
    });
    return;
  }

  response.locals.data = matchedData(request);
  next();
};


module.exports = (Server) => {
  Server.app.get('/api', (_, response) => response.send({
    timestamp: Date.now()
  }));

  Server.app.get('/', (_, response) => Server.db.getPayload().then((payload) => {
    const html = fs.readFileSync(path.join(Server.paths.root, 'build', 'index.html')).toString();
    response.send(html.replace(
      /(payload=false)|(payload=!1)/,
      `payload=${CircularJSON.stringify(payload)}`
    ));
  }).catch((error) => {
    response.status(500).send(error);
  }));

  // #region Business

  Server.app.post(
    '/api/business',
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
      const {
        name, type, address, city, state, postalCode
      } = response.locals.data;

      return Server.db.addBusiness(name, type, address, city, state, postalCode)
        .then(result => response.send(result))
        .catch(error => response.status(500).send(error));
    }
  );

  Server.app.delete('/api/business/:id', (request, response) => Server.db.deleteBusiness(request.params.id)
    .then(result => response.send(result))
    .catch(error => response.status(500).send(error)));

  // #endregion

  // #region Review

  Server.app.post(
    '/api/review',
    check('businessId', invalidParamMessage('businessId', 'string'))
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
      return Server.db.addReview(businessId, 1, score, text)
        .then(result => response.send(result))
        .catch(error => response.status(500).send(error));
    }
  );

  Server.app.delete('/api/review/:id', (request, response) => Server.db.deleteReview(request.params.id)
    .then(result => response.send(result))
    .catch(error => response.status(500).send(error)));

  // #endregion
};
