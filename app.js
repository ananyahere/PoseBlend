const express = require('express')
const mongoose = require("mongoose")
const http = require('http')
var cors = require("cors")
require('dotenv').config()
const PORT = process.env.PORT || 8000
const app = express()
const router = (global.router = express.Router())
const { Server } = require('socket.io')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded())
app.set("view engine", "ejs")

// app.use("/public", express.static(__dirname + "/public"));
app.use(express.static(__dirname + '/public'));

//Backend Routes
app.use("/api", require("./routes/user.js"))
app.use("/api", require("./routes/auth.js"))
app.use("/api", require("./routes/chat.js"))
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
app.get("/room_details", (req, res) => {
  res.render("room_details")
})
app.get("/profile/:user_id", (req, res) => {
  res.render("profile", {user_id: req.params.user_id})
})


// socket connection server setup
const server = http.createServer(app);

const io = new Server(server,{
  cors: {
    origin: `http://localhost:${PORT}`,
    methods: ['GET', 'POST'],
  }
})

io.on("connection", (socket) => {
  console.log("someone connected to a socket")

  socket.on("public_message", public_message => {
      io.emit("public_message", socket.id.substr(0,2)+" said "+public_message)
  })

  socket.on("join_room", (room_code) => {
      console.log("user joined room "+room_code)
      socket.join(room_code);      
  });

  socket.on("sending_new_message", (room_code, message) => {
      io.to(room_code).emit("new_message", message);
      console.log("room "+room_code+ " message "+message )
  });
})

// database connection
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log('mongoose connected')
    server.listen(PORT, () => {
      console.log(`PoseBlend is listening at port ${PORT}`);
    })
  }
  )
  .catch((err) => console.log(err));