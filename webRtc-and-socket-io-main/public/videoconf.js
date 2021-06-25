const socket = io();

const inputRoomNumber = queryParams.roomid;
const username = queryParams.uName;
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let roomNumber;
let localStream;
let remoteStream;
let rtcPeerConnection;

let iceServer = {
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
}

socket.emit("joinBroadcastRoom",inputRoomNumber,username);

let streamConstraints = {audio:true,video:true};
let isCaller;

let joinRoom = () => {
    if(!inputRoomNumber){
        alert("Empty Room Number Not Allowed");
    }else{
        roomNumber = inputRoomNumber;
        let name = username;
        socket.emit("create or join",roomNumber,name);
    }
}

(joinRoom)();

socket.on("created",(room)=>{
    navigator.mediaDevices.getUserMedia(streamConstraints).then((stream)=>{
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller =  true;
    }).catch((err)=>{
        console.log("Error occured "+err);
    });
});

socket.on("joined",(room)=>{
    navigator.mediaDevices.getUserMedia(streamConstraints).then((stream)=>{
        localStream = stream;
        localVideo.srcObject = stream;
        socket.emit("ready",roomNumber);
        document.getElementById("one").display = "none";
    }).catch((err)=>{
        console.log("Error occured "+err);
    });  
});

socket.on("ready",()=>{
    if(isCaller)
    {
        rtcPeerConnection = new RTCPeerConnection(iceServer);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;

        rtcPeerConnection.addStream(localStream);
        rtcPeerConnection.createOffer(setLocalAndOffer,(e)=>{console.log("error");})
    }
});

socket.on("offer2",(event)=>{
    if(!isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServer);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;
        rtcPeerConnection.addStream(localStream);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer(setLocalAndAnswer,(e)=>{console.log(e);})
    }
});

socket.on("answer2",(event)=>{
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    document.getElementById("two").display = "none";
});

socket.on("candidate",(event)=>{
    let candidate = new RTCIceCandidate({
        sdpMLineIndex:event.label,
        candidate:event.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

let onAddStream = (event) =>{
    remoteVideo.srcObject = event.stream;
    remoteStream = event.stream;
}

let onIceCandidate = (event) => {
    if(event.candidate){
        console.log("sending ice candidate");;
        socket.emit("candidate",{
            type:"candidate",
            label:event.candidate.sdpMLineIndex,
            id:event.candidate.sdpMid,
            candidate:event.candidate.candidate,
            room : roomNumber
        });
    }
}

let setLocalAndOffer = (sessionDescription) => {
    rtcPeerConnection.setLocalDescription(sessionDescription);
    socket.emit("offer2",{
        type:"offer",
        sdp: sessionDescription,
        room : roomNumber
    });
}

let setLocalAndAnswer = (sessionDescription) => {
    rtcPeerConnection.setLocalDescription(sessionDescription);
    socket.emit("answer2",{
        type:"answer",
        sdp:sessionDescription,
        room:roomNumber
    });
}