const { Client } = require('pg');
const dbName = process.env.NODE_ENV === 'test' ? 'linkin-db-test' : 'linkin-db';
const client = new Client({
  connectionString: `postgresql://localhost/${dbName}`
});

client.connect();
module.exports = client;
