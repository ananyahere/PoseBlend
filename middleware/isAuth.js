const jwt = require("jsonwebtoken");
const User = require("../model/user");
const mongoose = require("mongoose");

const isUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      token,
    });
    if (!user) throw new Error();

    req.userToken = token;
    req.user = user;
    console.log("next called");
    next();
  } catch (e) {
    console.log(e);
    res.status(401).send({ error: `Please authenticate as user.` });
  }
};

module.exports = isUser;
