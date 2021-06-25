const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
// let fs = require('fs')
// const https = require("https");
// let server = https.createServer({
// 	key: fs.readFileSync('server.key'),
// 	cert: fs.readFileSync('server.cert')
// }, app);


const path = require("path");
const io = require("socket.io")(server);

app.use(express.static(__dirname + "/public"));
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html')

app.use(express.json());

app.use(express.urlencoded({
	extended: true
}));

let chatArr = {};
let broadcastArr = {};
let videoCallArr = {};

app.get("/", (req, res) => {
	res.render("index");
});

app.get("/checkBroadcast", (req, res) => {
	res.render("broadcast");
});

app.get("/checkBroadcast2", (req, res) => {
	res.render("index2");
});

app.get("/checkVideoCall", (req, res) => {
	res.render("video_conf");
});

app.get("/chatApp", (req, res) => {
	res.render("chatApp");
})

io.sockets.on("error", e => console.log(e));

let broadcasters = {};

io.sockets.on("connection", socket => {

	console.log("user connected ", socket.id);

	socket.on("getArrVideoCall", (fn) => {
		fn(videoCallArr);
	});

	socket.on("getArrBroadcast", (fn) => {
		fn(broadcastArr);
	});

	socket.on("getArrChat", (fn) => {
		fn(chatArr);
	});

	socket.on("getChatRooms", () => {
		socket.emit("getChatRooms", Object.keys(arr));
	});

	socket.on("candidate", function (id, event) {
		socket.to(id).emit("candidate", socket.id, event);
	});

	socket.on("offer", function (id, event) {
		event.broadcaster.id = socket.id;
		socket.to(id).emit("offer", event.broadcaster, event.sdp);
	});

	socket.on("answer", function (event) {
		socket.to(broadcasters[event.room]).emit("answer", socket.id, event.sdp);
	});

	socket.on("register as viewer", function (user) {
		console.log("register as viewer for room", user.room);

		socket.join(user.room);
		user.id = socket.id;

		socket.to(broadcasters[user.room]).emit("new viewer", user);
	});

	socket.on("register as broadcaster", function (room) {
		console.log("register as broadcaster for room", room);
		broadcasters[room] = socket.id;
		socket.join(room);
	});

	socket.on("joinBroadcastRoom", (room, name) => {
		socket.roomName = room;
		socket.join(room);

		if (typeof broadcastArr[room] == "undefined") { broadcastArr[room] = [{ "id": socket.id, name }]; }
		else { broadcastArr[room].push({ "id": socket.id, name }); }
	});

	// ============================================================== //

	socket.on("joinChatRoom", (room, name) => {
		socket.roomName = room;
		socket.join(room);
		socket.to(room).emit("new user joined", name);
		if (typeof chatArr[room] == "undefined") { chatArr[room] = [{ "id": socket.id, name }]; }
		else { chatArr[room].push({ "id": socket.id, name }); }
	});

	socket.on("sendMsg", (room, name, msg) => {
		socket.to(room).emit("newMsg", name, msg);
	});

	socket.on("sendMsg2", (room, name, msg) => {
		socket.to(room).emit("newMsg2", name, msg);
	});

	// ============================================================== //

	socket.on("create or join", (room, name) => {
		console.log("create or join to room", room);
		console.log("name: ", name);
		console.log("socket", socket.id);
		socket.roomName = room;

		let numClients;
		if (typeof videoCallArr[room] == "undefined") { videoCallArr[room] = [{ "id": socket.id, name }]; numClients = 1; }
		else { videoCallArr[room].push({ "id": socket.id, name }); numClients = videoCallArr[room].length; }

		console.log(room + " has " + numClients + " clients ");

		if (numClients == 1) {
			socket.join(room);
			socket.emit("created", room);
		} else if (numClients == 2) {
			socket.join(room);
			socket.emit("joined", room);
		}
	});

	socket.on("ready", (room) => {
		socket.broadcast.to(room).emit('ready');
	});

	socket.on("candidate", (event) => {
		socket.broadcast.to(event.room).emit("candidate", event);
	});

	socket.on("offer2", (event) => {
		socket.broadcast.to(event.room).emit("offer2", event.sdp);
	});

	socket.on("answer2", (event) => {
		socket.broadcast.to(event.room).emit("answer2", event.sdp);
	});

	socket.on("disconnect", () => {
		console.log("user disconnected");
		if (typeof videoCallArr[socket.roomName] != "undefined") {
			for (var i = 0; i < videoCallArr[socket.roomName].length; i++) {
				if (videoCallArr[socket.roomName][i].id === socket.id) {
					videoCallArr[socket.roomName].splice(i, 1);
				}
			}
			if (videoCallArr[socket.roomName].length == 0) {
				delete videoCallArr[socket.roomName];
			}
		}

		if (typeof chatArr[socket.roomName] != "undefined") {
			for (var i = 0; i < chatArr[socket.roomName].length; i++) {
				if (chatArr[socket.roomName][i].id === socket.id) {
					chatArr[socket.roomName].splice(i, 1);
				}
			}
			if (chatArr[socket.roomName].length == 0) {
				delete chatArr[socket.roomName];
			}
		}

		if (typeof broadcastArr[socket.roomName] != "undefined") {
			for (var i = 0; i < broadcastArr[socket.roomName].length; i++) {
				if (broadcastArr[socket.roomName][i].id === socket.id) {
					broadcastArr[socket.roomName].splice(i, 1);
				}
			}
			if (broadcastArr[socket.roomName].length == 0) {
				delete broadcastArr[socket.roomName];
			}
		}
	})

});

server.listen(3000, () => {
	console.log("listening on port 3000");
});