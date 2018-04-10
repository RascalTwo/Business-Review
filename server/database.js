const fs = require('fs');
const sqlite = require('sqlite');
const bcrypt = require('bcryptjs');

/**
 * @typedef {Object} API_Response Response from an API endpoint.
 * @prop {Boolean} success If the request was successful.
 * @prop {Array<String>} message A message and the level of the message.
 * @prop {any} [data=undefined] Data to pass to the client.
 */

module.exports = class Database {
  /**
   * Create a instance of the database manager.
   *
   * @param {any} server Server instance.
   */
  constructor(server) {
    this.server = server;

    this.db = null;
  }

  /**
   * Initalize the database connection.
   */
  init() {
    return sqlite
      .open(`${this.server.paths.data}/database.db`, { Promise })
      .then((db) => {
        const schema = fs.readFileSync(`${this.server.paths.root}/server/schema.sql`).toString();
        return db.exec(schema);
      })
      .then((db) => {
        this.db = db;
      });
  }


  /**
   * Edit either a 'Business' or 'Review'.
   *
   * @param {String} id ID of entity to update.
   * @param {Object} updates Object of updates to make.
   *
   * @returns {Promise<API_Response>}
   */
  editEntity(name, id, updates) {
    if (name !== 'Business' && name !== 'Review') {
      return Promise.resolve({
        success: false,
        message: [`'${name}' not supported, only 'Business' and 'Review' are supported`, 'error']
      });
    }

    return this.db.get(`SELECT * FROM ${name.toLowerCase()} WHERE id = ?`, id).then((entity) => {
      if (!entity) {
        return {
          success: false,
          message: [`${name} not found`, 'warn']
        };
      }

      // Only keep object entries that have values that are not identical to the
      // values of the same keys of the 'entity' object.
      const changes = Object.entries(updates)
        .filter(entry => entity[entry[0]] !== entry[1])
        .reduce((obj, entry) => Object.assign(obj, { [entry[0]]: entry[1] }), {});

      if (!Object.keys(changes).length) {
        return {
          success: false,
          message: ['None of the provided updates contained new data', 'warn']
        };
      }

      // Create 'key = ?' for each key and seperate them with commas.
      return this.db.run(
        `UPDATE ${name.toLowerCase()} SET ${Object.keys(changes).map(key => `${key} = ?`).join(', ')} WHERE id = ?;`,
        ...Object.values(changes), id
      ).then(() => this.db.get(`SELECT * FROM ${name.toLowerCase()} WHERE id = ?`, id))
        .then(updated => ({
          success: true,
          message: [`${name} successfully updated`, 'success'],
          data: updated
        }));
    });
  }

  // #region User

  /**
   * Return if the given username and password are valid.
   *
   * @param {String} username
   * @param {String} password
   *
   * @returns {Promise<API_Response>}
   */
  canLogin(username, password) {
    return this.db.get('SELECT * FROM user WHERE username = ? COLLATE NOCASE;', username).then((user) => {
      if (!user) {
        return {
          success: false
        };
      }

      return bcrypt.compare(password, user.passwordHash).then(success => ({
        success,
        data: success ? user : undefined
      }));
    });
  }


  /**
   * Return a user by ID.
   *
   * @param {String} id ID of user to get.
   *
   * @returns {Promise<Object|null>}
   */
  getUser(id) {
    return this.db.get('SELECT * FROM user WHERE id = ?', id);
  }


  /**
   * Add a user to the database.
   *
   * @param {String} username
   * @param {String} password
   *
   * @returns {Promise<API_Response>}
   */
  addUser(username, password) {
    return this.db.get('SELECT * FROM user WHERE username = ? COLLATE NOCASE;', username).then((user) => {
      if (user) {
        return {
          success: false,
          message: ['Username already exists', 'warn']
        };
      }

      return bcrypt.hash(password, 8).then(passwordHash => this.db.run(
        'INSERT INTO user (username, passwordHash) VALUES (?, ?);',
        username, passwordHash
      ).then(result => ({
        success: true,
        message: ['User successfully added', 'success'],
        data: {
          id: result.lastID,
          username,
          passwordHash,
          reviews: []
        }
      })));
    });
  }

  // #endregion
  // #region Business

  /**
   * Append reviews to the provided businesses.
   *
   * @param {Array<Object>} businesses Businesses to append reviews to.
   *
   * @returns {Promise<Array<Object>>} Businesses with reviews appended.
   */
  async appendReviews(businesses) {
    // Create a '?' for every ID.
    const businessIds = businesses.map(business => business.id);
    const reviews = await this.db.all(
      `SELECT * FROM review WHERE businessId IN (${new Array(businessIds.length).fill('?').join(', ')}) ORDER BY date DESC;`,
      businessIds
    );

    // Create a '?' for every ID.
    const userIds = reviews.map(review => review.userId);
    const users = await this.db.all(
      `SELECT * FROM user WHERE id IN (${new Array(userIds.length).fill('?').join(', ')});`,
      userIds
    );

    // Create a <id: user> object map of users while also
    // giving each user a empty reviews array.
    const userMap = users.reduce((map, user) => {
      Object.assign(user, {
        reviews: []
      });
      return Object.assign(map, {
        [user.id]: user
      });
    }, {});

    // Create a <id: business> object map of businesses while also
    // giving each business a empty reviews array.
    const businessMap = businesses.reduce((map, business) => {
      Object.assign(business, {
        reviews: []
      });
      return Object.assign(map, {
        [business.id]: business
      });
    }, {});

    reviews.forEach((review) => {
      // Assign the business of the review to the business property.
      Object.assign(review, {
        business: businessMap[review.businessId]
      });
      // Add this review to the business reviews property.
      businessMap[review.businessId].reviews.push(review);

      if (userMap[review.userId]) {
        // Assign the user of the review to the user array.
        Object.assign(review, {
          user: userMap[review.userId]
        });
        // Add this review to the user reviews array.
        userMap[review.userId].reviews.push(review);
        return;
      }
      // Assign null if the user no longer exists - was deleted, etc.
      Object.assign(review, {
        user: null
      });
    });

    return businesses;
  }


  /**
   * Append photos to the provided businesses.
   *
   * @param {Array<Object>} businesses Businesses to append photos to.
   *
   * @returns {Promise<Array<Object>>} Businesses with photos appended.
   */
  async appendPhotos(businesses) {
    // Create a '?' for every ID.
    const businessIds = businesses.map(business => business.id);
    const photos = await this.db.all(
      `SELECT * FROM photo WHERE businessId IN (${new Array(businessIds.length).fill('?').join(', ')})ORDER BY position ASC;`,
      businessIds
    );

    // Create a <id: business> object map of businesses while also
    // giving each business a empty photos array.
    const businessMap = businesses.reduce((map, business) => {
      Object.assign(business, {
        photos: []
      });
      return Object.assign(map, {
        [business.id]: business
      });
    }, {});

    photos.forEach((photo) => {
      // Assign the business of the photo to the business property.
      Object.assign(photo, {
        business: businessMap[photo.businessId]
      });
      // Add this photo to the business photos property.
      businessMap[photo.businessId].photos.push(photo);
    });

    return businesses;
  }


  /**
   * Populate business with review and photo entities.
   *
   * @param {Array<Object>} businesses Businesses to populate.
   *
   * @returns {Promise<Array<Object>>} Circularly-linked businesses.
   */
  populateBusinesses(businesses) {
    // Append reviews and photos to the businesses, and then
    // convert all 'null' purchased values to 'false'.

    // Since all the business objects are being modified by reference, the
    // returned business arrays from the append funcions are identical to the
    // passed in business arrays.
    return this.appendReviews(businesses)
      .then(() => this.appendPhotos(businesses))
      .then(() => businesses.map((business) => {
        Object.assign(business, {
          purchased: business.purchased === null ? false : !!business.purchased
        });
        return business;
      }));
  }


  /**
   * Get the payload from the server.
   */
  getBusinesses() {
    return this.db.all('SELECT * FROM business;').then(businesses => this.populateBusinesses(businesses));
  }


  /**
   * Get a business by ID.
   *
   * @param {Number} id ID of business to get.
   *
   * @returns {Promise<API_Response>} 'data' is a circular object.
   */
  getBusiness(id) {
    return this.db.get('SELECT * FROM business WHERE id = ?;', id).then((business) => {
      if (!business) {
        return {
          success: false,
          message: ['Business not found', 'warn']
        };
      }

      return this.populateBusinesses([business]).then(businesses => ({
        success: true,
        message: ['Business fetched', 'success'],
        data: businesses[0]
      }));
    });
  }


  /**
   * Attempt to add a business to the database.
   *
   * @param {String} name
   * @param {String} [type=undefined]
   * @param {String} address Street address
   * @param {String} city
   * @param {String} state Either full or two-character state code.
   * @param {String} postalCode
   *
   * @returns {Promise<API_Response>}
   */
  addBusiness(name, type, address, city, state, postalCode) {
    return this.db.get(
      'SELECT * FROM business WHERE name = ? AND address = ? AND city = ? AND state = ? AND postalCode = ?;',
      name, address, city, state, postalCode
    ).then((found) => {
      if (found) {
        return {
          success: false,
          message: ['Business with that information already exists', 'warn'],
          // Convert 'purchased' property to a boolean.
          data: Object.assign(found, {
            purchased: found.purchased !== null
          })
        };
      }

      return this.db.run(
        'INSERT INTO business (name, type, address, city, state, postalCode) VALUES (?, ?, ?, ?, ?, ?);',
        name, type, address, city, state, postalCode
      ).then(result => ({
        success: true,
        message: ['Business successfully added', 'success'],
        data: {
          id: result.lastID,
          name,
          type,
          address,
          city,
          state,
          postalCode,
          purchased: false
        }
      }));
    });
  }


  /**
   * Delete a business by ID.
   *
   * Also deletes all photo and reviews related to said business.
   *
   * @param {String} id ID of business to delete.
   *
   * @returns {Promise<API_Response>}
   */
  deleteBusiness(id) {
    return this.db.run('DELETE FROM business WHERE id = ?;', id).then((result) => {
      if (!result.changes) {
        return {
          success: false,
          message: ['Business not found', 'warn']
        };
      }
      return this.db.run('DELETE FROM review WHERE businessId = ?', id)
        .then(() => this.db.run('DELETE FROM photo WHERE businessId = ?', id))
        .then(() => ({
          success: true,
          message: ['Business successfully deleted', 'success']
        }));
    });
  }


  // #endregion
  // #region Review


  /**
   * Get a review by ID.
   *
   * @param {Number} id ID of review to get.
   *
   * @returns {Promise<API_Response>}  'data' is a circular object.
   */
  getReview(id) {
    return this.db.get('SELECT * FROM review WHERE id = ?;', id).then((review) => {
      if (!review) {
        return {
          success: false,
          message: ['Review not found', 'warn']
        };
      }

      // Since all data is circular, it's easier to get the business of the review,
      // find the current review, and return that.

      // While it would be more efficient to write a custom function, it has been
      // decided that the time of the programmer is more valuable then the computing time wasted.
      return this.getBusiness(review.businessId)
        .then(result => result.data.reviews.find(loopReview => loopReview.id === id))
        .then(populatedReview => ({
          success: true,
          message: ['Review fetched', 'success'],
          data: populatedReview
        }));
    });
  }


  /**
   * Get all reviews.
   *
   * @returns {Promise<Array<Object>>} The array is circular.
   */
  getReviews() {
    // Get all businesses, then concat all their 'reviews' into a single array,
    // and sort by date decending - newest first, oldest last.
    return this.getBusinesses()
      .then(businesses => businesses
        .reduce((reviews, business) => reviews.concat(business.reviews), [])
        .sort((a, b) => b.date - a.date));
  }


  /**
   * Attempt to add a review to a business.
   *
   * @param {Number} businessId ID of businessing to review.
   * @param {Number} userId ID of the user making the review.
   * @param {Number} score Score of the review.
   * @param {String} text Text content of the review.
   *
   * @returns {Promise<API_Response>}
   */
  addReview(businessId, userId, score, text) {
    const now = Date.now();
    return this.db.get('SELECT * FROM business WHERE id = ?', businessId).then((found) => {
      if (!found) {
        return {
          success: false,
          message: ['Business not found', 'error']
        };
      }

      return this.db.run(
        'INSERT INTO review (businessId, userId, score, date, text) VALUES (?, ?, ?, ?, ?);',
        businessId, userId, score, now, text
      ).then(result => ({
        success: true,
        message: ['Review successfully added', 'success'],
        data: {
          id: result.lastID,
          businessId,
          userId,
          score,
          date: now,
          text
        }
      }));
    });
  }


  /**
   * Delete a review by ID.
   *
   * @param {String} id ID of review to delete.
   *
   * @returns {Promise<API_Response>}
   */
  deleteReview(id) {
    return this.db.run('DELETE FROM review WHERE id = ?;', id).then((result) => {
      if (!result.changes) {
        return {
          success: false,
          message: ['Review not found', 'warn']
        };
      }
      return {
        success: true,
        message: ['Review successfully deleted', 'success']
      };
    });
  }


  // #endregion
  // #region Photo


  /**
   * Upload a photo to the database.
   *
   * @param {Number} businessId ID of the business to upload photo for.
   * @param {Buffer} buffer Image buffer.
   * @param {String} caption Caption of image.
   *
   * @returns {Promise<API_Response>}
   */
  async uploadPhoto(businessId, buffer, caption) {
    const found = await this.db.get('SELECT * FROM business WHERE id = ?', businessId);
    if (!found) {
      return {
        success: false,
        message: ['Business not found', 'warn']
      };
    }

    const position = (await this.db.get('SELECT * FROM photo WHERE businessId = ? ORDER BY position DESC;', businessId)).position + 1;

    const id = (await this.db.run(
      'INSERT INTO photo (businessId, position, caption) VALUES (?, ?, ?)',
      businessId, position, caption
    )).lastID;

    fs.writeFileSync(`${this.server.paths.photos}/${id}.jpg`, buffer);

    return {
      success: true,
      message: ['Photo successfully uploaded', 'success'],
      data: {
        id,
        businessId,
        position,
        caption
      }
    };
  }


  // #endregion
};
