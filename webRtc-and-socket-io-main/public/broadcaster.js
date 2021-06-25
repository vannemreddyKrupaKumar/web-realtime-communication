let inputRoomNumber = queryParams.roomid;
let inputName = queryParams.uName;
let videoElement = document.getElementById("videoElement");
let viewers = document.getElementById("users");

let socket = io();
let rtcPeerConnections = {};
let users = 0;

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

socket.emit("joinBroadcastRoom",inputRoomNumber,inputName);

let sendMessage = () => {
  let msg = document.getElementById("message").value;
  document.getElementById("message").value = "";
  socket.emit("sendMsg2", inputRoomNumber, "<i>"+inputName+"</i>", msg);
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

let broadcastCam = () => {
  if (inputRoomNumber === "" || inputName === "") {
    alert("Please type a room number and a name");
  } else {
    user = {
      room: inputRoomNumber,
      name: inputName,
    };

    console.log(user.name + " is broadcasting...");

    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true
      })
      .then((stream1) => {
        AudioTrack = stream1.getAudioTracks()[0];
        navigator.mediaDevices
          .getDisplayMedia({
            video: true
          })
          .then((stream2) => {
            getOverlayedVideoStreams(stream2, stream1).then((overlayedStream) => {
              videoElement.srcObject = new MediaStream([overlayedStream.getVideoTracks()[0], AudioTrack]);              
            });
          })
          .catch((err) => {
            console.log("Error while accessing screen sharing devices", err);
          });
      })
      .catch((err) => {
        console.log("Error while accessing webcam media devices", err);
      });

    socket.emit("register as broadcaster", user.room);
  }
};

socket.on("new viewer", (viewer) => {
  rtcPeerConnections[viewer.id] = new RTCPeerConnection(iceServers);

  const stream = videoElement.srcObject;
  stream
    .getTracks()
    .forEach((track) => rtcPeerConnections[viewer.id].addTrack(track, stream));

  rtcPeerConnections[viewer.id].onicecandidate = (event) => {
    if (event.candidate) {
      console.log("sending ice candidate");
      console.log(event.candidate);
      socket.emit("candidate", viewer.id, {
        type: "candidate",
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
      });
    }
  };

  rtcPeerConnections[viewer.id]
    .createOffer()
    .then((sessionDescription) => {
      rtcPeerConnections[viewer.id].setLocalDescription(sessionDescription);
      socket.emit("offer", viewer.id, {
        type: "offer",
        sdp: sessionDescription,
        broadcaster: user,
      });
    })
    .catch((error) => {
      console.log(error);
    });

  let li = document.createElement("li");
  li.innerText = viewer.name;
  li.className = "liStyle";
  users = users+1;
  document.getElementById("np").innerHTML = users;
  viewers.appendChild(li);
});

socket.on("answer", (viewerId, event) => {
  rtcPeerConnections[viewerId].setRemoteDescription(
    new RTCSessionDescription(event)
  );
});

socket.on("candidate", (id, event) => {
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
  rtcPeerConnections[id].addIceCandidate(candidate);
});

function changeTab(evt, id) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(id).style.display = "block";
  evt.currentTarget.className += " active";
}

async function getOverlayedVideoStreams(stream1, stream2) {

  // prepare both players
  const vid1 = document.createElement("video");
  const vid2 = document.createElement("video");
  vid1.muted = vid2.muted = true;
  vid1.srcObject = stream1;
  vid2.srcObject = stream2;
  await Promise.all([
      vid1.play(),
      vid2.play()
  ]);
  // craete the renderer
  const canvas = document.createElement("canvas");
  let w = canvas.width = vid1.videoWidth;
  let h = canvas.height = vid1.videoHeight;
  const ctx = canvas.getContext("2d");

  // MediaStreams can change size while streaming, so we need to handle it
  vid1.onresize = (evt) => {
      w = canvas.width = vid1.videoWidth;
      h = canvas.height = vid1.videoHeight;
  };
  // start the animation loop
  anim();

  return canvas.captureStream();

  function anim() {
      // draw bg video
      ctx.drawImage(vid1, 0, 0);
      // caculate size and position of small corner-vid (you may change it as you like)
      const cam_w = vid2.videoWidth;
      const cam_h = vid2.videoHeight;
      const cam_ratio = cam_w / cam_h;
      const out_h = h / 3;
      const out_w = out_h * cam_ratio;
      ctx.drawImage(vid2, w - out_w, h - out_h, out_w, out_h);
      // do the same thing again at next screen paint
      requestAnimationFrame(anim);
  }
}