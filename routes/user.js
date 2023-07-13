const express = require("express");
const User = require("../model/user");
const Friendship = require("../model/friendship");
const router = new express.Router();
const isAuth = require("../middleware/isAuth");
const jwt = require("jsonwebtoken");
const helpers = require("./helpers");

// get user data of LOGGED IN USER
router.get("/myProfile", isAuth, async (req, res) => {
  try {
    // const { authorization } = req.headers;
    // const payload = jwt.decode(req.userToken);
    const user = await User.find({ _id: req.user._id });
    if (user) {
      res.status(200).json({ result: user });
    } else {
      res.status(404).json({ err: "No user found" });
    }
  } catch (e) {
    res.status(500).json({ err: "Something went wrong" });
  }
});

// get friendship info of LOGGED IN USER
router.get("/user/friends", isAuth, async (req, res) => {
  try {
    let friendsR = [];
    let incomingR = [];
    let outgoingR = [];

    // FRIENDS
    let friends1 = await Friendship
    .find({
      user_id1: req.user._id,
      status: 1,
    })
    .populate("user_id2")    
    .exec()   

    let friends2 = await Friendship
    .find({
      user_id2: req.user._id,
      status: 1,
    })
    .populate("user_id1")    
    .exec() 
    friendsR = friends1.concat(friends2);

    //INCOMING    
    let incoming = await Friendship
    .find({
      user_id2: req.user._id,
      status: 0,
    })
    .populate("user_id1")    
    .exec()   

    //OUTGOING
    let outgoing = await Friendship
    .find({
      user_id1: req.user._id,
      status: 0,
    })    
    .populate("user_id2")    
    .exec()    
    
    for(let friend of friends1)
      if(friend["user_id2"]) friendsR.push(friend["user_id2"])
    for(let friend of friends2)
      if(friend["user_id1"]) friendsR.push(friend["user_id1"])
    for(let friend of outgoing)
      if(friend["user_id2"]) outgoingR.push(friend["user_id2"])
    for(let friend of incoming)
      if(friend["user_id1"]) incomingR.push(friend["user_id1"])      
      
    if (friendsR.length || incomingR.length || outgoingR.length) {
      res.status(200).json({
        result: {
          friends: friendsR,
          incoming: incomingR,
          outgoing: outgoingR,
        },
      });
    } else {
      res.status(200).json({
        result: {
          friends: [],
          incoming: [],
          outgoing: [],
        },
      });
    }
  } catch (e) {
    console.log(e)
    res.status(500).json({ err: e });
  }
});

// get user data of OTHER USER
router.get("/userProfile/:user_id", isAuth, async (req, res) => {
  try {
    const OtherUserId = req.params["user_id"];
    // details of other user
    const details = await User.find({ _id: OtherUserId });
    if (details) {
      console.log("details of other user found", details);
      // check friendship status of loggedIn user & otherUserId
      const query1 = await Friendship.findOne({
        // loggedIn user sent request to otherUser -  3
        user_id1: req.user._id,
        user_id2: helpers.convertToObjectID(OtherUserId),
      });
      const query2 = await Friendship.findOne({
        // loggedIn user recieved request from otherUser - 2
        user_id1: helpers.convertToObjectID(OtherUserId),
        user_id2: req.user._id,
      });
      // set friend status
      let friendshipStatus = 0; // strangers

      // 0 - user_id1 and user_id2 are strangers
      // 1 - user_id1 and user_id2 are friends
      // 2 - loggedIn user recieved request
      // 3 - loggedIn user sent request

      if (query1 && query1?.status == 0) {
        console.log(query1);
        friendshipStatus = 3; // friendship requested
        console.log("friendship requested - 3");
      } else if (query2 && query2?.status == 0) {
        console.log(query2);
        friendshipStatus = 2; // friendship requested
        console.log("friendship requested - 2");
      } else if (
        (query1 || query2) &&
        (query1?.status == 1 || query2?.status == 1)
      ) {
        friendshipStatus = 1; // friends
        console.log("friends");
      } else if (query1?.status == -1 || query2?.status == -1) {
        friendshipStatus = 0; // strangers
        console.log("strangers");
      }
      res.status(200).json({
        result: {
          status: friendshipStatus,
          details,
        },
      });
    } else {
      console.log("No user found");
      res.status(404).json({ err: "No user found" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ err: "Something went wrong" });
  }
});

// Sending Friend Request
router.post("/user/friends/add/:user_id", isAuth, async (req, res) => {
  try {
    console.log("Sending Friend Request...");
    const otherUserId = req.params["user_id"];
    const body = {
      user_id1: req.user._id,
      user_id2: helpers.convertToObjectID(otherUserId),
      status: 0,
    };
    const friendshipRequest = new Friendship(body);
    await friendshipRequest.save();
    res.status(201).send("Request sent");
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
});

// Accepting Friend Request
router.put("/user/friends/accept/:user_id", isAuth, async (req, res) => {
  console.log("Accepting Friend Request...");
  const userToBeAccepted = req.params["user_id"];
  try {
    const updatedFriendship = await Friendship.findOneAndUpdate(
      {
        status: 0,
        user_id1: helpers.convertToObjectID(userToBeAccepted),
        user_id2: req.user._id,
      },
      {
        $set: {
          status: 1,
        },
      }
    );
    if (updatedFriendship) res.status(200).send("Request accepted");
    else res.status(404).json({ err: "No such friendship found" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
});

// Unfriend
router.delete("/user/friends/delete/:user_id", isAuth, async (req, res) => {
  console.log("Unfriend...");
  const userToBeUnfriend = req.params["user_id"];
  try {
    let users = [req.user._id, userToBeUnfriend];
    Friendship.deleteOne({
      user_id1: { $in: users },
      user_id2: { $in: users },
    }).then(() => {
      console.log("Friendship deleted");
      res.status(200).send("Friendship deleted");
    });
  } catch (err) {
    res.status(500).json({ err });
  }
});

// Search user
router.get("/search", (req, res) => {
  console.log("Searching...");
  const username = req.body.query;
  var regex = new RegExp(username, "i");
  try {
    User.find({ username: regex }).then((result) =>
      res.status(200).json(result)
    );
  } catch (err) {
    res.status(500).json({ err });
  }  
});

// update user score
router.put("/user/score", isAuth, async (req, res) => {
  console.log("updating user score...");
  try {
    const score = req.body.score;
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.user._id,
      },
      {
        $inc: {
          score: score,
        },
      }
    );
    if (updatedUser)
      res.status(200).json({
        status: 1,
        message: "Score updated!",
      });
    else res.status(400).send("Unable to update score");
  } catch (err) {
    res.status(500).json({ err });
  }
});

// get user score
router.get("/user/score", isAuth, async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.user._id,
    });
    if (user)
      res.status(200).json({
        result: {
          score: user.score,
        },
      });
    else res.status(400).send("Unable to fetch user-info");
  } catch (err) {
    res.status(500).json({ err });
  }
});

module.exports = router;
