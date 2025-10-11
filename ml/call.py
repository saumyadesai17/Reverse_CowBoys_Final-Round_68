import asyncio
import base64
import json
import websockets
import os
from dotenv import load_dotenv
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import uvicorn
import threading

load_dotenv()

app = FastAPI(title="Outbound AI Call System")

class CallRequest(BaseModel):
    phone_number: str
    
class OutboundCallManager:
    def __init__(self):
        self.twilio_client = Client(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN")
        )
        self.deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")
        self.from_phone = os.getenv("TWILIO_PHONE_NUMBER")  # Your Twilio phone number
        self.active_calls = {}
        
    def sts_connect(self):
        if not self.deepgram_api_key:
            raise Exception("DEEPGRAM_API_KEY not found")

        sts_ws = websockets.connect(
            "wss://agent.deepgram.com/v1/agent/converse",
            subprotocols=["token", self.deepgram_api_key]
        )
        return sts_ws

    def load_config(self):
        with open("config.json", "r") as f:
            return json.load(f)

    def make_outbound_call(self, to_phone_number, webhook_url=None):
        """
        Initiates an outbound call
        """
        if not webhook_url:
            webhook_url = f"{os.getenv('NGROK_URL', 'http://localhost:8000')}/voice"
            
        try:
            call = self.twilio_client.calls.create(
                twiml=f'''<?xml version="1.0" encoding="UTF-8"?>
                <Response>
                    <Say>Hello! Connecting you to our AI assistant. Please wait.</Say>
                    <Stream url="wss://localhost:4040/stream/{to_phone_number}">
                        <Parameter name="track" value="both" />
                    </Stream>
                    <Pause length="30"/>
                </Response>''',
                to=to_phone_number,
                from_=self.from_phone
            )
            
            print(f"Outbound call initiated to {to_phone_number}")
            print(f"Call SID: {call.sid}")
            return call.sid
            
        except Exception as e:
            print(f"Error making outbound call: {e}")
            return None

    async def handle_barge_in(self, decoded, twilio_ws, streamsid):
        if decoded["type"] == "UserStartedSpeaking":
            clear_message = {
                "event": "clear",
                "streamSid": streamsid
            }
            await twilio_ws.send(json.dumps(clear_message))

    async def handle_text_message(self, decoded, twilio_ws, sts_ws, streamsid):
        await self.handle_barge_in(decoded, twilio_ws, streamsid)
        # No function calling - just handle barge-in

    async def sts_sender(self, sts_ws, audio_queue):
        print("sts_sender started")
        while True:
            chunk = await audio_queue.get()
            await sts_ws.send(chunk)

    async def sts_receiver(self, sts_ws, twilio_ws, streamsid_queue):
        print("sts_receiver started")
        streamsid = await streamsid_queue.get()

        async for message in sts_ws:
            if type(message) is str:
                print(message)
                decoded = json.loads(message)
                await self.handle_text_message(decoded, twilio_ws, sts_ws, streamsid)
                continue

            raw_mulaw = message

            media_message = {
                "event": "media",
                "streamSid": streamsid,
                "media": {"payload": base64.b64encode(raw_mulaw).decode("ascii")}
            }

            await twilio_ws.send(json.dumps(media_message))

    async def twilio_receiver(self, twilio_ws, audio_queue, streamsid_queue):
        BUFFER_SIZE = 20 * 160
        inbuffer = bytearray(b"")

        async for message in twilio_ws:
            try:
                data = json.loads(message)
                event = data["event"]

                if event == "start":
                    print("Stream started")
                    start = data["start"]
                    streamsid = start["streamSid"]
                    streamsid_queue.put_nowait(streamsid)
                elif event == "connected":
                    print("Stream connected")
                    continue
                elif event == "media":
                    media = data["media"]
                    chunk = base64.b64decode(media["payload"])
                    if media["track"] == "inbound":
                        inbuffer.extend(chunk)
                elif event == "stop":
                    print("Stream stopped")
                    break

                while len(inbuffer) >= BUFFER_SIZE:
                    chunk = inbuffer[:BUFFER_SIZE]
                    audio_queue.put_nowait(chunk)
                    inbuffer = inbuffer[BUFFER_SIZE:]
            except Exception as e:
                print(f"Error in twilio_receiver: {e}")
                break

    async def handle_stream(self, twilio_ws, path):
        """Handle the WebSocket stream for outbound calls"""
        phone_number = path.split('/')[-1]  # Extract phone number from path
        print(f"Handling stream for outbound call to: {phone_number}")
        
        audio_queue = asyncio.Queue()
        streamsid_queue = asyncio.Queue()

        async with self.sts_connect() as sts_ws:
            config_message = self.load_config()
            await sts_ws.send(json.dumps(config_message))

            await asyncio.wait(
                [
                    asyncio.ensure_future(self.sts_sender(sts_ws, audio_queue)),
                    asyncio.ensure_future(self.sts_receiver(sts_ws, twilio_ws, streamsid_queue)),
                    asyncio.ensure_future(self.twilio_receiver(twilio_ws, audio_queue, streamsid_queue)),
                ]
            )

        await twilio_ws.close()

# Global instance
call_manager = OutboundCallManager()

# FastAPI routes for Twilio webhooks
@app.post("/voice", response_class=PlainTextResponse)
async def voice_webhook():
    """Handle voice webhook from Twilio"""
    response = VoiceResponse()
    
    print("Voice webhook called - outbound call connected")
    
    # Create TwiML response with Stream
    response.say("Hello! You're connected to our AI assistant.")
    response.stream(url="wss://localhost:4040/stream", track='both')
    response.pause(length=30)
    
    return str(response)

@app.post("/call")
async def initiate_call(call_request: CallRequest):
    """API endpoint to initiate outbound calls"""
    phone_number = call_request.phone_number
    
    if not phone_number:
        raise HTTPException(status_code=400, detail="phone_number is required")
    
    call_sid = call_manager.make_outbound_call(phone_number)
    
    if call_sid:
        return {"status": "success", "call_sid": call_sid, "phone_number": phone_number}
    else:
        raise HTTPException(status_code=500, detail="Failed to initiate call")

@app.get("/")
async def root():
    return {
        "message": "Outbound AI Call System", 
        "endpoints": {
            "make_call": "POST /call",
            "voice_webhook": "POST /voice",
            "websocket": "ws://localhost:4040/stream"
        }
    }

# WebSocket handler for streams
async def websocket_handler(websocket, path):
    """Handle WebSocket connections from Twilio streams"""
    print(f"WebSocket connection established: {path}")
    
    if path.startswith('/stream'):
        await call_manager.handle_stream(websocket, path)
    else:
        print(f"Unknown path: {path}")

async def start_websocket_server():
    """Start WebSocket server for Twilio streams"""
    print("Starting WebSocket server on localhost:4040")
    await websockets.serve(websocket_handler, "localhost", 4040)
    print("WebSocket server ready!")

async def main():
    # Start WebSocket server in background
    websocket_task = asyncio.create_task(start_websocket_server())
    
    # Start FastAPI server
    config = uvicorn.Config(
        app=app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
    server = uvicorn.Server(config)
    
    print("🚀 Outbound AI Call System Starting...")
    print("- FastAPI server: http://localhost:8000")
    print("- WebSocket server: ws://localhost:4040")
    print("- API docs: http://localhost:8000/docs")
    print("- To make a call: POST http://localhost:8000/call")
    
    await asyncio.gather(
        websocket_task,
        server.serve()
    )

if __name__ == "__main__":
    asyncio.run(main())