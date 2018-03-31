const fs = require('fs');
const sqlite = require('sqlite');

module.exports = class Database {
  /**
   * Create a instance of the database manager.
   *
   * @param {any} server Server instance.
   */
  constructor(server) {
    this.root = server.root;

    this.db = null;
  }

  /**
   * Initalize the database connection.
   */
  init() {
    return sqlite
      .open(`${this.root}/data/database.db`, { Promise })
      .then((db) => {
        const schema = fs.readFileSync(`${this.root}/server/schema.sql`).toString();
        return db.exec(schema);
      })
      .then((db) => {
        this.db = db;
      });
  }


  /**
   * Append reviews to the given business objects.
   *
   * @param {Array<Object>} businesses Businesses to append reviews to.
   *
   * @returns {Promise<Array<Object>>} Businesses with reviews appended.
   */
  async appendReviews(businesses) {
    const reviews = await this.db.all('SELECT * FROM review ORDER BY date DESC;');
    const users = await this.db.all('SELECT * FROM user;');

    const userMap = users.reduce((map, user) => {
      Object.assign(user, {
        reviews: []
      });
      return Object.assign(map, {
        [user.id]: user
      });
    }, {});

    const businessMap = businesses.reduce((map, business) => {
      Object.assign(business, {
        reviews: []
      });
      return Object.assign(map, {
        [business.id]: business
      });
    }, {});

    reviews.forEach((review) => {
      Object.assign(review, {
        business: businessMap[review.business_id]
      });
      businessMap[review.business_id].reviews.push(review);

      if (userMap[review.user_id]) {
        Object.assign(review, {
          user: userMap[review.user_id]
        });
        userMap[review.user_id].reviews.push(review);
        return;
      }
      Object.assign(review, {
        user: null
      });
    });

    return businesses;
  }


  /**
   * Append photos to the provided businessed.
   *
   * @param {Array<Object>} businesses Businesses to append photos to.
   *
   * @returns {Promise<Array<Object>>} Businesses with photos appended.
   */
  async appendPhotos(businesses) {
    const photos = await this.db.all('SELECT * FROM photo ORDER BY position ASC;');

    const businessMap = businesses.reduce((map, business) => {
      Object.assign(business, {
        photos: []
      });
      return Object.assign(map, {
        [business.id]: business
      });
    }, {});

    return photos.map((photo) => {
      Object.assign(photo, {
        business: businessMap[photo.business_id]
      });
      businessMap[photo.business_id].photos.push(photo);

      return photo;
    });
  }


  /**
   * Get the payload from the server.
   */
  async getPayload() {
    const businesses = await this.db.all('SELECT * FROM business;');
    await this.appendReviews(businesses);
    await this.appendPhotos(businesses);
    return businesses;
  }
};
