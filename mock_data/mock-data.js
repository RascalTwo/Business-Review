const fs = require('fs');
const sqlite = require('sqlite');

/**
 * Either create the mock data or return the function to do so.
 */
function run() {
  const generate = function generate(recipe, filepath = './fakedata.db') {
    return sqlite.open(filepath, { Promise }).then(db => db.exec(recipe));
  };
  const recipe = fs.readFileSync(`${__dirname}/mock-recipe.sql`).toString();

  if (require.main !== module) return generate.bind(null, recipe);

  if (process.argv[2] === undefined) return console.log('Filepath for new mock database required');

  return generate(recipe, process.argv[2]);
}

module.exports = run;
run();
