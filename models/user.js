/** User class for message.ly */

const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require("../config")

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 

    // hash password
    const hashed_password = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const result = await db.query(
      `INSERT INTO users(
        username,
        password,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at
      )
      VALUES (
        $1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`,
        [username, hashed_password, first_name, last_name, phone]
    )
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    try{
      const result = await db.query(
        `SELECT password
         FROM users
         WHERE username = $1`,
         [username]
      )
      const user = result.rows[0]

      if (user) {
        return await bcrypt.compare(password, user.password)
      }
      throw new ExpressError("Invalid username or password.", 400)
    } catch (err) {
      return next(err);
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    try{
      const result = await db.query(
        `UPDATE users
         SET last_login_at = current_timestamp
         WHERE username = $1
         RETURNING username`,
         [username]);
      
      const user = result.rows[0]
      if(!user){
        throw new ExpressError("User not found", 400);
      };
    } catch (err){
      return next(err);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone
       FROM users`
    );
    return result.rows;

  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    try {
      const result = await db.query(
        `SELECT username, first_name, last_name, phone, join_at, last_login_at
         FROM users
         WHERE username =$1`,
         [username]
      )
      if(result.rows.length === 0) {
        throw new ExpressError("User not found", 400);
      }
      return result.rows[0];
    } catch(err) {
      return next(err)
    }
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const result = await db.query(
      `SELECT m.id, 
              m.to_username, 
              m.body, 
              m.sent_at, 
              m.read_at,
              u.username,
              u.first_name,
              u.last_name,
              u.phone
        FROM messages AS m
        JOIN users AS u ON m.to_username = u.username
        WHERE from_username = $1`,
        [username]
    )
    let messages = result.rows;
    if(!messages) {
      throw new ExpressError("User not found", 400);
    }
    messages = messages.map(m => {
      return {
        id: m.id,
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at,
        to_user: {
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone
        }
      }
    })
    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const result = await db.query(
      `SELECT m.id, 
              m.from_username, 
              m.body, 
              m.sent_at, 
              m.read_at,
              u.username,
              u.first_name,
              u.last_name,
              u.phone
        FROM messages AS m
        JOIN users AS u ON m.from_username = u.username
        WHERE to_username = $1`,
        [username]
    )
    let messages = result.rows;
    if(!messages) {
      throw new ExpressError("User not found", 400);
    }
    messages = messages.map(m => {
      return {
        id: m.id,
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at,
        from_user: {
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone
        }
      }
    })
    return messages;
  }
}


module.exports = User;