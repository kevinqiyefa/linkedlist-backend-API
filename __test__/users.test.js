process.env.NODE_ENV = 'test';
const db = require('../db');
const request = require('supertest');
const app = require('../');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const auth = {};

beforeAll(async () => {
  await db.query(`CREATE TABLE companies
  (
    id SERIAL PRIMARY KEY,
    name TEXT,
    logo TEXT,
    handle TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );`);

  await db.query(`CREATE TABLE users
  (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    photo TEXT, 
    current_company TEXT REFERENCES companies (handle) ON DELETE SET NULL
  );`);

  await db.query(`CREATE TABLE jobs
  (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    salary TEXT,
    equity FLOAT,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE
  );`);

  await db.query(`CREATE TABLE jobs_users
  (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
  );`);
});

beforeEach(async () => {
  // login a user, get a token, store the user ID and token
  const hashedPassword = await bcrypt.hash('secret', 1);
  await db.query(
    "INSERT INTO users (username, password, first_name, last_name, email) VALUES ('test', $1, 'kevin', 'qi', 'test@gmail.com')",
    [hashedPassword]
  );
  const response = await request(app)
    .post('/users/auth')
    .send({
      username: 'test',
      password: 'secret'
    });

  auth.user_token = response.body.token;
  auth.current_user_id = jwt.decode(auth.user_token).user_id;

  // do the same for company "users"
  const hashedCompanyPassword = await bcrypt.hash('secret', 1);
  await db.query(
    "INSERT INTO companies (handle, password) VALUES ('testcompany', $1)",
    [hashedCompanyPassword]
  );
  const companyResponse = await request(app)
    .post('/companies/auth')
    .send({
      handle: 'testcompany',
      password: 'secret'
    });

  auth.company_token = companyResponse.body.token;
  auth.current_company_id = jwt.decode(auth.company_token).company_id;
});

afterEach(async () => {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM companies');
});

afterAll(async () => {
  await db.query('DROP TABLE IF EXISTS jobs_users');
  await db.query('DROP TABLE IF EXISTS jobs');
  await db.query('DROP TABLE IF EXISTS users');
  await db.query('DROP TABLE IF EXISTS companies');
  db.end();
});

describe(`GET / users`, () => {
  test('gets a list of 1 user', async () => {
    const response = await request(app)
      .get('/users')
      .set('authorization', auth.user_token);
    expect(response.body).toHaveLength(1);
  });
});

describe(`GET / users/:username`, () => {
  test('gets a list of 1 user', async () => {
    const response = await request(app)
      .get('/users/:username')
      .set('authorization', auth.user_token);
    expect(response.body).toHaveLength(1);
  });
});

// describe(`DELETE / users/:id`, () => {
//   test('successfully deletes own user', async () => {
//     const response = await request(app)
//       .delete(`/users/${auth.current_user_id}`)
//       .set('authorization', auth.user_token);
//     expect(response.status).toBe(200);
//     expect(response.body).toEqual({ message: 'Deleted!' });
//   });

//   test('cannot delete other user', async () => {
//     const response = await request(app)
//       .delete(`/users/${auth.current_user_id + 1}`)
//       .set('authorization', auth.user_token);
//     expect(response.status).toBe(403);
//   });
// });

// describe(`PATCH / companies/:id`, () => {
//   test('successfully updates a company', async () => {
//     const response = await request(app)
//       .patch(`/users/${auth.current_company_id}`)
//       .set('authorization', auth.user_token);
//     expect(response.status).toBe(200);
//     expect(response.body).toEqual({ message: 'Deleted!' });
//   });

// });
