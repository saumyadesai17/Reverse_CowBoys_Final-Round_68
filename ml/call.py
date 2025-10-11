import asyncio
import base64
import json
import websockets
import os
from dotenv import load_dotenv
# from pharmacy_functions import FUNCTION_MAP

load_dotenv()
def sts_connect():
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        raise Exception("DEEPGRAM_API_KEY not found")

    sts_ws = websockets.connect(
        "wss://agent.deepgram.com/v1/agent/converse",
        subprotocols=["token", api_key]
    )
    return sts_ws


def load_config():
    with open("config.json", "r") as f:
        return json.load(f)