const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  content: {
    type: String
  }
}, {
  timestamps: true
})

const Message = mongoose.model('Messages', messageSchema)

module.exports = Message