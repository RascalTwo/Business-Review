module.exports = class Database {
	/**
	 * Create a instance of the database manager.
	 * 
	 * @param {Server} server Server instance.
	 */
	constructor(server){
		this.root = server.root;

		this.db = null;
	}

	/**
	 * Initalize the database connection.
	 */
	init(){
		return Promise.resolve().then(() => this.db = {});
	}
}