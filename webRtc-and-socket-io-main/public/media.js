var constraints = { audio:true,
                   video: {width:{min:320,ideal:320,max:640 },
				           height:{ min:240,ideal:240,max:480},
						   framerate:15   }
				  };

var videoElement = document.getElementById("vElement");
var screen = document.getElementById("screen");

let desktopStream=new MediaStream();
let kkStream = new MediaStream();  
let AudioTrack;
let VideoTrack;

//............................................................
function StreamCam()
 {
  if (!navigator.mediaDevices.getUserMedia){
	 alert('UserMedia not supported on your browser, use the latest version of Firefox or Chrome');
     }
   else
    {  navigator.mediaDevices.getUserMedia(constraints)
			.then(function(stream) {
				videoElement.srcObject = stream;
				 AudioTrack = stream.getAudioTracks()[0];
			     VideoTrack = stream.getVideoTracks()[0];
		        videoElement.play();
			});
 }}
//........................................................................................
function Present()
{ if (!navigator.mediaDevices.getDisplayMedia){
	 alert('DisplayMedia not supported on your browser, use the latest version of Firefox or Chrome');
     }
  else{
      navigator.mediaDevices.getDisplayMedia( 
          {video: true
		   }).then(stream1 => {               
			desktopStream = new MediaStream([stream1.getVideoTracks()[0], AudioTrack]);			
			videoElement.srcObject = desktopStream;
			videoElement.play();
		   });
  }
}
