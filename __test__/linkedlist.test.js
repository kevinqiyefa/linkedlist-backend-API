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
    name TEXT NOT NULL,
    logo TEXT,
    handle TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
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
    title TEXT,
    salary TEXT,
    equity FLOAT,
    company TEXT REFERENCES companies(handle) ON DELETE CASCADE
  );`);

  await db.query(`CREATE TABLE jobs_users
  (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
  );`);

  await db.query(`CREATE TABLE applications
  (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    username TEXT REFERENCES users(username) ON DELETE CASCADE
  );
  `);
});
// SET UP
beforeEach(async () => {
  // creating companies
  // handle: Warriors, password: pw (name: Warriors)
  const warriorsCompanyPassword = await bcrypt.hash('pw', 1);
  await db.query(
    `INSERT INTO companies (name, logo, handle, email, password)
     VALUES ('Warriors', 'https://vignette.wikia.nocookie.net/logopedia/images/c/c0/Cb02u6k4eyzy3zwkxmivf37hj.gif/revision/latest?cb=20150113160445', 'Warriors', 'warriors@gmail.com', $1) RETURNING *`,
    [warriorsCompanyPassword]
  );
  const nintendoCompanyPassword = await bcrypt.hash('pw', 1);
  await db.query(
    `INSERT INTO companies (name, logo, handle, email, password)
     VALUES ('Nintendo', 'https://avatars0.githubusercontent.com/u/13444851?s=460&v=4', 'Nintendo', 'nintendo@gmail.com', $1) RETURNING *`,
    [nintendoCompanyPassword]
  );
  // const warriorsCompanyResponse = await request(app)
  //   .post('/company-auth')
  //   .send({
  //     handle: 'Warriors',
  //     password: 'pw'
  //   });
  // auth.company_token = warriorsCompanyResponse.body.token;
  // auth.current_handle = jwt.decode(auth.company_token).handle;
  // login a user, get a token, store the user ID and token
  //
  const hashedPassword = await bcrypt.hash('secret', 1);
  await db.query(
    `INSERT INTO users (username, password, first_name, last_name, email) VALUES ('kevin', $1, 'john', 'qi', 'ya@gmail.com')`,
    [hashedPassword]
  );
  // const response = await request(app)
  //   .post('/user-auth')
  //   .send({
  //     username: 'kevin',
  //     password: 'secret'
  //   });
  // AUTH object above, set user_token and current user id to use for later
  // auth.user_token = response.body.token;
  // auth.current_username = jwt.decode(auth.user_token).username;
  // do the same for company "users"
  // SETTING UP JOBS
  // text, text, float, text
  await db.query(
    `INSERT INTO jobs (title, salary, equity, company) VALUES('Super Engineer', '500000', 3.4, 'Warriors') RETURNING *`
  );
});

afterEach(async () => {
  await db.query('DELETE FROM jobs');
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM companies');
});

afterAll(async () => {
  await db.query('DROP TABLE IF EXISTS applications');
  await db.query('DROP TABLE IF EXISTS jobs_users');
  await db.query('DROP TABLE IF EXISTS jobs');
  await db.query('DROP TABLE IF EXISTS users');
  await db.query('DROP TABLE IF EXISTS companies');
  db.end();
});

describe(`POST /companies`, () => {
  test('successfully create a new company', async () => {
    const response = await request(app)
      .post('/companies')
      .send({
        name: 'michael',
        email: 'google@gmail.com',
        handle: 'rithm',
        password: 'foo123',
        logo: 'https://avatars0.githubusercontent.com/u/13444851?s=460&v=4'
      });
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('michael');
  });

  test('error handling status code', async () => {
    const response = await request(app)
      .post('/companies')
      .send({
        name: 1232,
        email: 'google@gmail.com',
        handle: 'rithmkk',
        password: 'foo123',
        logo: 'https://avatars0.githubusercontent.com/u/13444851?s=460&v=4'
      });
    expect(response.status).toBe(400);
    expect(response.body.error.title).toBe('Bad Request');
  });

  test('error handling status code', async () => {
    const response = await request(app)
      .post('/companies')
      .send({
        name: '12321',
        email: 'google@gmail.com',
        handle: 'Nintendo',
        password: 'foo123',
        logo: 'https://avatars0.githubusercontent.com/u/13444851?s=460&v=4'
      });
    expect(response.status).toBe(409);
    expect(response.body.error.title).toBe('Conflict');
  });
});

describe(`POST / company-auth`, () => {
  test('successfully gets a token', async () => {
    const response = await request(app)
      .post('/company-auth')
      .send({
        handle: 'Warriors',
        password: 'pw'
      });
    auth.company_token = response.body.token;
    auth.current_handle = jwt.decode(auth.company_token).handle;
    expect(response.status).toBe(200);
    expect(response.body.token).not.toEqual(undefined);
  });

  test('gets a unauthorized error', async () => {
    const response = await request(app)
      .post('/company-auth')
      .send({
        handle: 'Warriors',
        password: 'pwssss'
      });

    expect(response.status).toBe(401);
    expect(response.body.error.title).toBe('Unauthorized');
  });

  test('gets a validation error', async () => {
    const response = await request(app)
      .post('/company-auth')
      .send({
        handle: 444,
        password: 'pw'
      });

    expect(response.status).toBe(404);
    expect(response.body.error.title).toBe('Not Found');
  });
});

describe(`POST /users`, () => {
  test('successfully create a new user', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        first_name: 'Michael',
        last_name: 'Hueter',
        username: 'hueter',
        email: 'michael@rithmschool.com',
        password: 'foo123',
        current_company: 'Warriors',
        photo: 'https://avatars0.githubusercontent.com/u/13444851?s=460&v=4'
      });
    expect(response.status).toBe(200);
    expect(response.body.username).toBe('hueter');
  });

  test('Validation errors', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        first_name: 11111,
        last_name: 'Hueter',
        username: 'hueter',
        email: 'michael@rithmschool.com',
        password: 'foo123',
        current_company: 'Warriors',
        photo: 'https://avatars0.githubusercontent.com/u/13444851?s=460&v=4'
      });
    expect(response.status).toBe(400);
    expect(response.body.error.title).toBe('Bad Request');
  });

  test('error same username', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        first_name: 'Michael',
        last_name: 'Hueter',
        username: 'kevin',
        email: 'michael@rithmschool.com',
        password: 'foo123',
        current_company: 'Warriors',
        photo: 'https://avatars0.githubusercontent.com/u/13444851?s=460&v=4'
      });
    expect(response.status).toBe(409);
    expect(response.body.error.title).toBe('Conflict');
  });
});

describe(`POST / user-auth`, () => {
  test('successfully log in for a user', async () => {
    const response = await request(app)
      .post('/user-auth')
      .send({
        username: 'kevin',
        password: 'secret'
      });
    auth.user_token = response.body.token;
    auth.current_username = jwt.decode(auth.user_token).username;
    expect(response.status).toBe(200);
    expect(response.body.token).not.toEqual(undefined);
  });

  test('gets a unauthorized error', async () => {
    const response = await request(app)
      .post('/user-auth')
      .send({
        username: 'joe',
        password: 'secre'
      });

    expect(response.status).toBe(404);
    expect(response.body.error.title).toBe('Not Found');
  });

  test('gets a validation error', async () => {
    const response = await request(app)
      .post('/user-auth')
      .send({
        username: 'kevin',
        password: 'p'
      });

    expect(response.status).toBe(401);
    expect(response.body.error.title).toBe('Unauthorized');
  });
});

describe(`GET / users`, () => {
  test('successfully gets all the users', async () => {
    const response = await request(app)
      .get('/users')
      .set('authorization', auth.user_token);
    expect(response.status).toBe(200);
    expect(response.body[0].username).toBe('kevin');
  });
});

describe(`GET / users/:username`, () => {
  test('successfully gets a list of 1 user', async () => {
    const response = await request(app)
      .get(`/users/${auth.current_username}`)
      .set('authorization', auth.user_token);
    expect(response.status).toBe(200);
    expect(response.body.first_name).toBe('john');
  });
});

describe(`PATCH / users/:username`, () => {
  test('successfully updates a user', async () => {
    const response = await request(app)
      .patch(`/users/${auth.current_username}`)
      .send({
        first_name: 'Elie',
        last_name: 'Hueter',
        username: 'hueter',
        email: 'michael@rithmschool.com',
        password: 'foo123',
        current_company: 'Nintendo',
        photo: 'https://avatars0.githubusercontent.com/u/13444851?s=460&v=4'
      })
      .set('authorization', auth.user_token);

    expect(response.status).toBe(200);
    expect(response.body.first_name).toEqual('Elie');
  });
});

describe(`GET / companies`, () => {
  test('gets all the companies', async () => {
    const response = await request(app)
      .get('/companies')
      .set('authorization', auth.company_token);
    expect(response.status).toBe(200);
    expect(response.body[0].name).toBe('Warriors');
  });
});

describe(`GET / companies/:handle`, () => {
  test('gets a list of 1 company', async () => {
    const response = await request(app)
      .get(`/companies/${auth.current_handle}`)
      .set('authorization', auth.company_token);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Warriors');
  });
});

describe(`PATCH / companies/:handle`, () => {
  test('successfully updates a company', async () => {
    const response = await request(app)
      .patch(`/companies/${auth.current_handle}`)
      .send({
        name: 'rithm',
        email: 'google@gmail.com',
        handle: 'rithm',
        password: 'foo123',
        logo: 'https://avatars0.githubusercontent.com/u/13444851?s=460&v=4'
      })
      .set('authorization', auth.company_token);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('rithm');
  });
});

describe(`POST /jobs`, () => {
  test('successfully post a new job from one company', async () => {
    const response = await request(app)
      .post('/jobs')
      .set('authorization', auth.company_token)
      .send({
        title: 'Gamer Tester',
        salary: '200000',
        equity: 5.5
      });
    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Gamer Tester');
  });
});

describe(`GET / jobs`, () => {
  test('gets all the jobs', async () => {
    const response = await request(app)
      .get('/jobs')
      .set('authorization', auth.company_token);
    auth.jobid = response.body[0].id;
    expect(response.status).toBe(200);
    expect(response.body[0].title).toBe('Super Engineer');
  });
});

describe(`GET / jobs/:id`, () => {
  test('gets a list of 1 jobs', async () => {
    const response = await request(app)
      .get(`/jobs/${++auth.jobid}`)
      .set('authorization', auth.company_token);
    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Super Engineer');
  });
});

describe(`POST /jobs/:job_id/applications`, () => {
  test('successfully appy for a job and view the applications', async () => {
    const response = await request(app)
      .post(`/jobs/${++auth.jobid}/applications`)
      .set('authorization', auth.user_token);

    expect(response.status).toBe(200);
    expect(response.body.job_id).toBe(auth.jobid);

    //get all the applications
    const res = await request(app)
      .get(`/jobs/${auth.jobid}/applications`)
      .set('authorization', auth.user_token);
    expect(res.status).toBe(200);
    expect(res.body[0].job_id).toBe(auth.jobid);
  });
});

describe(`GET / jobs/:id/application/:id`, () => {
  test('gets one job applications and deletes one application', async () => {
    const response = await request(app)
      .post(`/jobs/${++auth.jobid}/applications`)
      .set('authorization', auth.user_token);

    expect(response.status).toBe(200);
    expect(response.body.job_id).toBe(auth.jobid);

    //gets one job applications and
    const res = await request(app)
      .get(`/jobs/${auth.jobid}/applications/2`)
      .set('authorization', auth.user_token);

    expect(res.status).toBe(200);
    expect(res.body.job_id).toBe(auth.jobid);

    //deletes one application
    const res1 = await request(app)
      .delete(`/jobs/${auth.jobid}/applications/2`)
      .set('authorization', auth.user_token);

    expect(res1.status).toBe(200);
    expect(res1.body.message).toBe('Deleted job application!!!');
  });
});

describe(`PATCH / jobs/:id`, () => {
  test('successfully updates a job if it belongs to the correct company', async () => {
    const response = await request(app)
      .patch(`/jobs/${++auth.jobid}`)
      .set('authorization', auth.company_token)
      .send({
        title: 'Student',
        salary: '100000',
        equity: 1
      });
    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Student');
  });
});

describe(`DELETE / jobs/:id`, () => {
  test('successfully deletes a job if the job belongs to the correct company', async () => {
    const response = await request(app)
      .delete(`/jobs/${++auth.jobid}`)
      .set('authorization', auth.company_token);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Deleted a job!!!' });
  });
});

describe(`DELETE / users/:username`, () => {
  test('successfully deletes own user', async () => {
    const response = await request(app)
      .delete(`/users/${auth.current_username}`)
      .set('authorization', auth.user_token);
    // delete auth.current_username;
    // delete auth.user_token;
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Deleted user!' });
  });

  test('cannot delete other user', async () => {
    const username = auth.current_username + '1';
    const response = await request(app)
      .delete(`/users/${username}`)
      .set('authorization', auth.user_token);
    delete auth.current_username;
    delete auth.user_token;
    expect(response.status).toBe(403);
    expect(response.body.error.title).toBe('Forbidden');
  });
});

describe(`DELETE / companies/:handle`, () => {
  test('successfully deletes own company', async () => {
    const response = await request(app)
      .delete(`/companies/${auth.current_handle}`)
      .set('authorization', auth.company_token);
    delete auth.current_handle;
    delete auth.company_token;
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Deleted company!' });
  });
});
