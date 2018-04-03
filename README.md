# Business Review

This is based largly on `create-react-app`, of which has not yet been ejected yet.

`yarn dev` starts both the `express` and `webpack` server hot-reloading on port `3000`;

`yarn start` builds the react app for production and starts up the express server on prot `8080`.

## Scripts

There are a lot of scripts, but they each have a reason, and almost half of them just run other scripts.

These are the big ones that matter:

- `pre-commit`
	- Runs the `eslint` and `test` scripts.
- `start`
	- Runs the `build-react` and `start-server` scripts.
- `dev`
	- Runs the `dev-server` and `dev-react` scripts.

The rest you shouldn't need to ever directly call:

- `eslint`
	- Runs `eslint` on all code.
- `test`
	- Runs the `test-server` and `test-react` scripts.
- `test-server`
	- Runs `jest` on the server-side tests inside the `./tests/` directory.
- `test-react`
	- Runs the react `jest` tests.
- `test-react-test`
	- Runs a single `test.js` file of your input.
- `dev-server`
	- Runs the `express` server through `nodemon`.
- `dev-react`
	- Runs the webpack hot-loading server for react.
- `start-server`
	- Starts the `express` server.
- `build-react`
	- Build the react files.
- `eject-react`
	- Eject the `create-react-app`.

## Inital Payload

The inital payload from the server is passes to the client via injection into the `index.html` file.

That is, unless the server is running in development mode. If that is the case, then the payload is saved to `hot_data.json` when the server starts up and the client reads from that.

## Testing

Testing is done in two parts, one set of tests test the server, while another set tests the client.

The server-side tests are located in `./tests/`, while the client-side tests are located in `./src/` and are suffixed with `.test.js`.

The server-side tests output coverage reports to `./coverage/`, you can open the `index.html` file in this directory to view the lines directly.

## Mock Data

The directory `./mock_data/` contains a `.sql` recipe and a script to execute said recipe.

Simply execute it with the path of the database to populate as an argument, like so:

`node mock-data.js ./mockdata.db`

This database must be already created with all tables, yet must have no data within it.

For example, to populate the current database with the mock data, this command would do:

`node mock_data/mock-data.js ./data/database.db`.