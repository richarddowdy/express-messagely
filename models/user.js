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
    const result = db.query(
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
      const result = db.query(
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
      const result = db.query(
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

  static async all() { }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { }
}


module.exports = User;