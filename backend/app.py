import uvicorn
import socketio
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from filter_logic import process_emails_async

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio_app = socketio.ASGIApp(sio, app)

@sio.on('connect')
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.on('start_process')
async def start_process(sid, data):
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        await sio.emit('error', {'message': 'Credentials missing!'}, to=sid)
        return

    print(f"Starting process for {email}")

    async def progress_callback(current, total, log_msg):
        await sio.emit('progress', {
            'current': current,
            'total': total,
            'log': log_msg,
            'percent': (current / total * 100) if total > 0 else 0
        }, to=sid)
        await asyncio.sleep(0) # Yield

    try:
        await process_emails_async(email, password, progress_callback)
        await sio.emit('finished', {'message': 'Filtering Process Complete!'}, to=sid)
    except Exception as e:
        await sio.emit('error', {'message': str(e)}, to=sid)

if __name__ == "__main__":
    uvicorn.run(sio_app, host="0.0.0.0", port=8001)
