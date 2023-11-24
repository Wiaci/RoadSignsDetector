import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import "../style.css"

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const boundingBoxesRef = useRef(null);
  const [boundingBoxesPrev, setBoundingBoxesPrev] = useState([])
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [response, setResponse] = useState(null)
  const [sum, setSum] = useState(0)
  const [num, setNum] = useState(0)

  useEffect(() => {
    const classesPrev = []
    for (const box of boundingBoxesPrev) {
      classesPrev.push(box.cls)
    }

    const classesToPrint = []
    for (const box of boundingBoxes) {
      if (!classesPrev.includes(box.cls)) {
        classesToPrint.push({
          cls: box.cls,
          prob: box.prob
        })
      }
    }

    for (const cls of classesToPrint) {
      console.log(cls.cls, cls.prob)
    }

    setBoundingBoxesPrev(boundingBoxes)
  }, [boundingBoxes])

  const getBoxes = async () => {
    if (videoRef.current.src) {
      const url = captureScreenshot()
      var start = new Date().getTime();
      console.time('wait')
      const response = await axios.post("http://localhost:8000/process-frame", {
          url: url
      })
      console.timeEnd('wait')
      var end = new Date().getTime();
      setSum(sum + end - start)
      setNum(num + 1)
      if (response.data.bounding_boxes.length > 0) {
        const bbx = response.data.bounding_boxes
        const lst = []
        for (let i = 0; i < bbx.length; i++) {
          let bx = bbx[i]
          lst.push({
            x: bx[0],
            y: bx[1],
            width: bx[2] - bx[0],
            height: bx[3] - bx[1],
            cls: bx[4],
            prob: bx[5]
          })
        }
        setBoundingBoxes(lst)
      } else setBoundingBoxes([])
      setResponse(response)
    }
  }

  const captureScreenshot = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/png')
    }
  }

  useEffect(() => {
    if(response) getBoxes()
  }, [response])

  const handleVideoChange = async (event) => {
    console.log("*** Average on front: " + (sum / num))
    setSum(0)
    setNum(0)
    const resp = await axios.post("http://127.0.0.1:8000/get-average")
    console.log("Average on back: " + resp.data)

    const file = event.target.files[0];
    const videoUrl = URL.createObjectURL(file);
    videoRef.current.src = videoUrl;
    videoRef.current.play();
    videoRef.current.volume = 0
    getBoxes()
    
  };

  useEffect(() => {
    const boundingBoxesDiv = boundingBoxesRef.current;

    // Update the position and size of bounding boxes
    boundingBoxes.forEach((box, index) => {
      const { x, y, width, height, cls, prob } = box;
      //console.log(x, y, width, height, cls)

      const boxElement = document.createElement('div');
      boxElement.classList.add('bounding-box');
      boxElement.style.top = `${y}px`;
      boxElement.style.left = `${x}px`;
      boxElement.style.width = `${width}px`;
      boxElement.style.height = `${height}px`;
      boxElement.textContent = cls

      boundingBoxesDiv.appendChild(boxElement);
    });

    return () => {
      // Clear previous bounding boxes
      boundingBoxesDiv.innerHTML = '';
    };
  }, [boundingBoxes]);

  return (
    <div>
      <input type="file" accept="video/*" onChange={handleVideoChange} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <video ref={videoRef} controls/>
        {/* Отрисовка bounding boxes */}
        <div ref={boundingBoxesRef} className="bounding-boxes-container" />
        <canvas ref={canvasRef} style={{ border: '1px solid black', display: 'none' }} />
      </div>
    </div>
  );
};

export default VideoPlayer;