const express = require('express')
const mongoose = require("mongoose")
const path = require("path")
var cors = require("cors")
require('dotenv').config()
const PORT = process.env.PORT || 8000
const app = express()
const router = (global.router = express.Router())

app.use(cors())
app.use(express.json())
app.use(express.urlencoded())
app.set("view engine", "ejs")

// app.use(express.static(__dirname + '/public'));
app.use("/public", express.static(__dirname + "/public"));

//Backend Routes
app.use("/api", require("./routes/user.js"))
app.use("/api", require("./routes/auth.js"))
app.use(router)

//Frontend Routes
app.get("/", (req, res) => {
  res.render("index")
})
app.get("/friendplay/:roomcode", (req, res) => {
  res.render("friendplay", {room_code: req.params.roomcode})
})
app.get("/soloplay", (req, res) => {
  res.render("soloplay")
})
app.get("/signup", (req, res) => {
  res.render("signup")
})
// app.get("/sockdemo", (req, res) => {
//   res.render("sockdemo")
// })
app.get("/room_details", (req, res) => {
  res.render("room_details")
})
app.get("/profile/:user_id", (req, res) => {
  res.render("profile", {user_id: req.params.user_id})
})


// database connection
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log('mongoose connected')
    app.listen(PORT, () => {
      console.log(`Listening at port ${PORT}`);
    })
  }
  )
  .catch((err) => console.log(err));