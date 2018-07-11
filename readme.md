# Express + PG - Users / Companies / Jobs

## Part I - Users

- Create a table for users, each user should have a:

  - first_name
  - last_name
  - email
  - photo

- Here is what a user object looks like:

  ```js
  {
    "id": 1,
    "first_name": "Michael",
    "last_name": "Hueter",
    "email": "michael@rithmschool.com",
    "photo": "https://avatars0.githubusercontent.com/u/13444851?s=460&v=4",
    "company_id": 1, // MANY-TO-ONE with Companies --> THIS IS IMPLEMENTED IN THE NEXT SECTION
    "jobs": [2, 3] // MANY-TO-MANY with Jobs --> THIS IS IMPLEMENTED IN THE FINAL SECTION
  }
  ```

- Create an API that has the following five routes:

  - `POST /users` - this should create a new user
  - `GET /users` - this should return a list of all the user objects
  - `GET /users/:id` - this should return a single user found by its `id`
  - `PATCH /users/:id` - this should update an existing user and return the updated user
  - `DELETE /users/:id` - this should remove an existing user and return the deleted user

- **BONUS** - add a frontend that allows for seeing all the users, creating new users and deleting users. Do not worry about any kind of authentication/authorization.

- **BONUS** - add front-end functionality for updating users. This will involve writing quite a bit more jQuery to accomplish this task.

- **BONUS** - Use vanilla JavaScript instead of jQuery.

## Part II - Companies

**Before you continue, make sure you have completed the exercises in the previous section. This exercise builds off of the previous exercise.**

Create a table for `companies`, each company should have a:

- name
- logo

- Next, add a column to your users table called `current_company_id` which is a foreign key that references the companies table. In this relationship, one company has many users, and each user belongs to a single company. Make sure then when a company is deleted, all of the users associated with that company are deleted also.

- Create an API that has the following five routes:

  - `POST /companies` - this should create a new company
  - `GET /companies` - this should return a list of all the company objects
  - `GET /companies/:id` - this should return a single company found by its id and it should include all of the ids of users who work there
  - `PATCH /companies/:id` - this should update an existing company and return the updated company
  - `DELETE /companies/:id` - this should remove an existing company and return the deleted company

- Here is what a company object looks like:

  ```js
  {
    "id": 1,
    "name": "Rithm School",
    "logo":
      "https://avatars3.githubusercontent.com/u/2553776?s=400&u=18c328dafb508c5189bda56889b03b8b722d5f22&v=4",
    "users": [1, 2], // array of user IDs who work there. ONE-TO-MANY with Users
    "jobs": [2, 3] // array of job IDs listed by the company. ONE-TO-MANY with Jobs --> THIS IS IMPLEMENTED IN THE FINAL SECTION
  }
  ```

## Part III - Jobs

**Before you continue, make sure you have completed the exercises in the previous sections. This exercise builds off of the previous exercise.**

- Add a table for `jobs`, each job should have a:

  - title
  - salary
  - equity
  - company_id

- `jobs` has a one to many relationship with `companies` which means there is a foreign key in the jobs table that references the companies table. In this relationship, one company has many jobs, and each job belongs to a single company. Make sure then when a company is deleted, all of the jobs associated with that company are deleted also.

- `jobs` is also a many to many relationship with `users`, because a user can apply to many jobs. This means you'll also have to create a join table for these two associations. You can call that table `jobs_users` and it should contain a `job_id` and `user_id`.

- Make sure your application has the following routes:

  - `POST /jobs` - this route creates a new job
  - `GET /jobs` - this route should list all of the jobs.
  - `GET /jobs/:id` - this route should show information about a specific job
  - `PATCH /jobs/:id` - this route should let you update a job by its ID
  - `DELETE /jobs/:id` - this route lets you delete a job posting

- Here is what a job object looks like:

  ```js
  {
      "title": "Software Engineer",
      "salary": "100000",
      "equity": 4.5,
      "company_id": 1
  }
  ```

---

## Part IV - User Authentication + Authorization

**Before you continue, make sure you have completed at least Part I and Part II above**

- Add a column in the `users` table called `username`. This column should have a type of `text` and should be unique and never be null.

- Add a column in the `users` table called `password`. This column should have a type of `text` and should never be null. The column should store a **hashed** password using bcrypt. Make sure that when a user is created and updated, the password is stored securely.

- Add a new route `/users/auth`. This route accepts a POST request with a username and password, and it returns a JWT if the username exists and the password is correct. The JWT should store the id of the logged in user.

- Protect the following routes and make sure only a user who has logged in can use them:

  - `GET /users`
  - `GET /users/:id`
  - `GET /jobs`
  - `GET /jobs/:id`
  - `GET /companies`
  - `GET /companies/:id`

- Protect the following routes and make sure they are only accessible by the user with the correct id.

  - `PATCH /users/:id`
  - `DELETE /users/:id`

## Part V - Company Auth

- Add a column in the `companies` table called `handle`. This column should have a type of `text` and should be unique and never be null.

- Add a column in the `companies` table called `password`. This column should have a type of `text` and should never be null. The column should store a **hashed** password using bcrypt. Make sure that when a company is created and updated, the password is stored securely.

- Add a new route `/companies/auth`. This route accepts a POST request with a company's `handle` and `password`, and it returns a JWT if the handle exists and the password is correct. The JWT should store the id of the logged in company.

- Allow logged in companies to see the following routes (these are all the routes logged in users can see):

  - `GET /users`
  - `GET /users/:id`
  - `GET /jobs`
  - `GET /jobs/:id`
  - `GET /companies`
  - `GET /companies/:id`

- Protect the following routes and make sure they are only accessible by the company with the correct id.

  - `PATCH /companies/:id`
  - `DELETE /companies/:id`

- Protect the following routes so that only companies can post jobs, and posted jobs can only be edited and deleted by the company that created them.

  - `POST /jobs`
  - `PATCH /jobs/:id`
  - `DELETE /jobs/:id`

---

## Part VI - Testing + Validation

**Before you continue, make sure you have completed at least Part I and Part II of this exercise**

- Make sure that there is validation each time a `user` is created or updated.
- Make sure that there is validation each time a `company` is created or updated.
- Make sure that there is validation each time a `job` is created or updated.
- Add tests for your `users`, `companies`, and `jobs` route.

---

# Solutions

To get any of these solutions running locally:

1.  Fork/clone the repository
2.  `cd` into a folder
3.  `npm install`
4.  `psql < schema.sql`
5.  `nodemon` or `node app.js`
