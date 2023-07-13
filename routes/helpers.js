const mongoose = require('mongoose')

exports.convertToObjectID = (mystr) => {
  return mongoose.Types.ObjectId(mystr);
}

exports.convertToObjectIDlist = () => {
  let tlist = [];
  for (let item of mylist) {
      tlist.push(mongoose.Types.ObjectId(item));
  }  
  return tlist;
}