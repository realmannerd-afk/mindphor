# Mindphor Python SDK

Monitor your AI app in production.

## Install

pip install mindphor

## Usage

from mindphor import track, Memory

@track(api_key="mp_xxx", model="gpt-4",
       user_id="user_123")
def ask_ai(question):
    return openai.chat(question)

## Memory Tracking

mem = Memory(api_key="mp_xxx")
mem.set("user_123", "plan", "pro")
