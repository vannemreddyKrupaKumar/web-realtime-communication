
function sendMessage() {
   var msg = document.getElementById('message').value;
   if (msg) {
      socket.emit('msg', { room: room, message: msg, user: user });
   }
}

socket.on('newmsg', function (data) {
   if (user) {
      console.log("data.message " + data.message);
      document.getElementById('message-container').innerHTML += '<div><b>' +
         data.user + '</b>: ' + data.message + '</div>'
   }
})