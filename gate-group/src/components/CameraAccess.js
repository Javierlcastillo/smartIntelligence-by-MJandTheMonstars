import React, { useEffect, useRef, useState } from "react";

const [isCameraAccessGranted, setIsCameraAccessGranted] = useState(false);

  async function getVideoStream() {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: 'camera',
      });
      if (permissionStatus.state === 'denied') {
        setIsCameraAccessGranted(false);
        return;
      }
    } catch (error) {
      console.log('Error checking camera permissions: ', error);
    }
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true});
      console.log(stream);
    } catch(error) {
      console.log('Error getting video stream: ', error);
    }
    if (!stream || stream.getVideoTracks().length === 0) {
      console.log('Could not get a vald video track.');
      return;
    } else {
      setIsCameraAccessGranted(stream.active);
    }
  }

  useEffect(() => {
    if(selected === 'scanBarcode'){
      getVideoStream();
    }
  }, [selected]);

function CameraAccess(){
    const [openCamera, setOpenCamera] = useState(false);
    const [image, setImage] = useState(null);
    const videoPlayerRef = useRef(null);
    const canvasRef = useRef(null);

    const initializeMedia = async() => {
        try{
            const stream = await navigator.mediaDevices.getUserMedia({ video:true});
            videoPlayerRef.current.srcObject = stream;
            videoPlayerRef.current.style.display = "block";
        } catch (error) {
            console.error("erroraccessing camera: ", error);
        }
    };

    const handleCapture = () => {
        const canvas  = canvasRef.current;
        const context = canvas.getContext("2d");

        if (videoPlayerRef.current){
            context.drawImage(
                videoPlayerRef.current,
                0,
                0,
                canvas.width,
                videoPlayerRef.current.videoHeight /
                (videoPlayerRef.current.videoWidth / canvas.width)
            );

            const imageDataURL = canvas.toDataURL("image/png");

            setImage(imageDataURL);
            console.log(imageDataURL);

            videoPlayerRef.current.srcObject?.getVideoTracks().forEach((track) => {
                track.stop();
            });
            videoPlayerRef.current.style.display = "none";
            canvas.style.display = "block";

            setOpenCamera(false);
        }

    }

    useEffect(() => {
        if(openCamera) {
            initializeMedia();
        }

        return () => {}
    }, [openCamera])

    return(
        <div>
            <video 
                className="video-component"
                ref={videoPlayerRef}
                id="player"
                autoPlay>
            </video>
            <canvas
                id="canvas"
                ref={canvasRef}
                style={{ display: "none"}}>
            </canvas>
            <button
            className="buttonCamera"
            id="capture"
            onClick={handleCapture}
            ></button>
        </div>
    );
}

export default CameraAccess; 