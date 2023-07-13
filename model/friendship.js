const mongoose = require('mongoose')

const friendshipSchema = new mongoose.Schema({
  user_id1: {   
    type: mongoose.Schema.Types.ObjectId,  // user who sends the friendship-request
    ref: 'Users'
  },
  user_id2: {
    type: mongoose.Schema.Types.ObjectId, // user who recieves the friendship-request
    ref: 'Users'
  },
  status: {
    type: Number,
    default: -1     // user_id1 and user_id2 are strangers    
  }
})

const Friendship = mongoose.model('Friendship', friendshipSchema)

module.exports = Friendship