const express = require("express");
const router = new express.Router();
const isAuth = require("../middleware/isAuth");
const Message = require("../model/message");
const helpers = require("./helpers");

// get conversation
router.get("/user/chat/:user_id", isAuth, async (req, res) => {
  const OtherUserId = req.params["user_id"];
  console.log("getting conversation between", req.user._id, "and", OtherUserId);
  try {
    const messages1 = await Message.find({
      senderId: helpers.convertToObjectID(OtherUserId),
      recipientId: req.user._id,
    })
      .populate({ path: "senderId", select: "username email" })
      .populate({ path: "recipientId", select: "username email" })
      .exec();

    const messages2 = await Message.find({
      recipientId: helpers.convertToObjectID(OtherUserId),
      senderId: req.user._id,
    })
      .populate({ path: "senderId", select: "username" })
      .populate({ path: "recipientId", select: "username" })
      .exec();
    let messages = [];
    for (let message of messages1) {
      const msg = {
        _id: message._id,
        sender_id: message.senderId._id,
        sender_username: message.senderId.username,
        recipient_id: message.recipientId._id,
        recipient_username: message.senderId.username,
        content: message.content,
        timestamp: message.timestamp.toString(),
      };
      messages.push(msg);
    }
    for (let message of messages2) {
      const msg = {
        _id: message._id,
        sender_id: message.senderId._id,
        sender_username: message.senderId.username,
        recipient_id: message.recipientId._id,
        recipient_username: message.senderId.username,
        content: message.content,
        timestamp: message.timestamp.toString(),
      };
      messages.push(msg);
    }    
    res.status(200).json({
      result: {
        messages,
      },
    });
  } catch (err) {
    res.status(500).json({ err });
  }
});

// recieve new message
router.post("/user/chat/recieve/:user_id", isAuth, async (req, res) => {
  const OtherUserId = req.params["user_id"];
  const messageBody = req.body;
  try {
    const message = new Message({
      senderId: helpers.convertToObjectID(OtherUserId),
      recipientId: req.user._id,
      content: messageBody.content,
      timestamp: new Date(messageBody.timestamp),
    });
    await message.save();
    res.status(201).send("Recieved message stores");
  } catch (err) {
    res.status(500).json({ err });
  }
});

// send new message
router.post("/user/chat/send/:user_id", isAuth, async (req, res) => {
  const OtherUserId = req.params["user_id"];
  const messageBody = req.body;
  try {
    const message = new Message({
      recipientId: helpers.convertToObjectID(OtherUserId),
      senderId: req.user._id,
      content: messageBody.content,
      timestamp: new Date(messageBody.timestamp),
    });
    await message.save();
    res.status(201).send("Sent message stored");
  } catch (err) {
    res.status(500).json({ err });
  }
});

module.exports = router;
