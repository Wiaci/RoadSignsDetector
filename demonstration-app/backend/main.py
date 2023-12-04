from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
from PIL import Image
from ultralytics import YOLO
from time import time

app = FastAPI()
model = YOLO("best_yolo_experiment4.onnx")


# CORS settings
origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FrameData(BaseModel):
    url: str

@app.post("/process-frame")
async def process_frame(url: FrameData):
    global sum, num
    start = time()
    result = detect(url.url)
    tm = time() - start
    sum += tm
    num += 1
    return {"bounding_boxes": result}

def detect(url):
    _, encoded_data = url.split(",", 1)
    if encoded_data == '':
        return []
    image_data = base64.b64decode(encoded_data)
    image_stream = io.BytesIO(image_data)
    
    results = model.predict(Image.open(image_stream))
    result = results[0]
    output = []
    for box in result.boxes:
        x1, y1, x2, y2 = [
          round(x) for x in box.xyxy[0].tolist()
        ]
        class_id = box.cls[0].item()
        prob = round(box.conf[0].item(), 2)
        output.append([
          x1, y1, x2, y2, result.names[class_id], prob
        ])
    return output