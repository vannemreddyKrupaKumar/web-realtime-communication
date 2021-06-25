let inputRoomNumber = queryParams.roomid;
let inputName = queryParams.uName;
let videoElement = document.getElementById("videoElement");

let AudioTrack;

let socket = io();
let rtcPeerConnections = {};

let iceServers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    },
    {
      "urls": "turn:vc.example.com:3478",
      "username": "kks",
      "credential": "kks123"
    }
  ]
};

socket.emit("joinBroadcastRoom", inputRoomNumber, inputName);

let sendMessage = () => {
  let msg = document.getElementById("message").value;
  document.getElementById("message").value = "";
  socket.emit("sendMsg2", inputRoomNumber, inputName, msg);
  let msgcontainer = document.getElementById("message-container");
  let div = document.createElement("div");
  div.className = "msgs";
  div.innerHTML = "<h6>"+"<i>"+inputName+"</i>"+"</h6>"+msg;
  msgcontainer.appendChild(div);
}

socket.on("newMsg2", (name, msg) => {
  let msgcontainer = document.getElementById("message-container");
  let div = document.createElement("div");
  div.className = "msgs";
  div.innerHTML = "<h6>"+"<i>"+name+"</i>"+"</h6>"+msg;
  msgcontainer.appendChild(div);
});

let btnJoinViewer = () => {
  if (inputRoomNumber === "" || inputName === "") {
    alert("Please type a room number and a name");
  } else {
    user = {
      room: inputRoomNumber,
      name: inputName,
    };
    socket.emit("register as viewer", user);
  }
};

socket.on("offer", (broadcaster, sdp) => {
  console.log(broadcaster.name + "is broadcasting...");

  rtcPeerConnections[broadcaster.id] = new RTCPeerConnection(iceServers);
  rtcPeerConnections[broadcaster.id].setRemoteDescription(sdp);
  rtcPeerConnections[broadcaster.id]
    .createAnswer()
    .then((sessionDescription) => {
      rtcPeerConnections[broadcaster.id].setLocalDescription(
        sessionDescription
      );
      socket.emit("answer", {
        type: "answer",
        sdp: sessionDescription,
        room: user.room,
      });
    });

  rtcPeerConnections[broadcaster.id].ontrack = (event) => {
    videoElement.srcObject = event.streams[0];
  };

  rtcPeerConnections[broadcaster.id].onicecandidate = (event) => {
    if (event.candidate) {
      console.log("sending ice candidate");
      socket.emit("candidate", broadcaster.id, {
        type: "candidate",
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
      });
    }
  };
  
});

socket.on("candidate", (id, event) => {
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
  rtcPeerConnections[id].addIceCandidate(candidate);
});

socket.on("disconnectPeer", (data) => {
  peerConnection.close();
});

window.onunload = window.onbeforeunload = () => {
  socket.disconnect();
  socket.close();
};