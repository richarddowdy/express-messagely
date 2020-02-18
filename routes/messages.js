
const express = require('express');
const ExpressError = require("../expressError")
const Message = require("../models/message")

const router = express.Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', async function (req, res, next){
  try{
    const messageId = req.params.id  

    const currentUser = req.user.username

    let result = await Message.get(messageId);
    if (result.to_user.username === currentUser || result.from_user.username === currentUser){
      return res.json({ "message": result });
    }
    throw new ExpressError("Not Authorized", 400);
  } catch (err){
    return next(err)
  }
  
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", async function(req, res, next){
  try{
    const currentUser = req.user.username
    const { to_user, body } = req.body
    if (!to_user || !body){
      throw new ExpressError("Unable to complete request", 400)
    }

    let result = await Message.create({from_username: currentUser, to_username: to_user, body})

    return res.json({ "message": result });
  } catch(err){
    return next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", async function(req, res, next){
  try{
    const messageId = req.params.id;

    const intendedRecipient = await Message.get(messageId).to_user.username;

    if (intendedRecipient === req.user.username) {
      let result = await Message.markRead(messageId);
      return res.json({ "message": result });
    }
    throw new ExpressError("Unauthorized", 400);
  } catch (err) {
    return next(err);
  }
})

module.exports = router;