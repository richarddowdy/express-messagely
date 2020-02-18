const express = require('express');

const jwt = require("jsonwebtoken");
const ExpressError = require("../expressError");

const { SECRET_KEY } = require("../config")
const User = require("../models/user")

const router = express.Router();

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async function(req, res, next){
  try{

    const { username, password } = req.body;

    let validUser = await User.authenticate(username, password)
    User.updateLoginTimestamp(username)
    
    if(validUser){
      let token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ token })
    }  
    
    throw new ExpressError("Invalid username or password.", 400)
    
  } catch (err){
    return next(err)
  }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async function(req, res, next){
  try{

    const { username, password, first_name, last_name, phone} = req.body

    User.register({username, password, first_name, last_name, phone})

    let token = jwt.sign({ username }, SECRET_KEY);

    return res.json({ token })

  } catch (err){
    return next(err);
  }
})

module.exports = router