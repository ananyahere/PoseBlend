const express = require("express");
const User = require("../model/user");
const router = new express.Router();


// sign up
router.post("/auth/signup", async (req, res) => {
  //create a new user
  const user = new User(req.body);
  // Error handing
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// log in
router.post("/auth/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.username,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    console.log(e);
    res.status(400).send();
  }
});

module.exports = router;
