import time
import threading
from .client import MindphorClient

def track(api_key: str, user_id: str = None,
          model: str = "unknown"):
    
    def decorator(func):
        def wrapper(*args, **kwargs):
            
            start = time.time()
            result = func(*args, **kwargs)
            latency_ms = int(
                (time.time() - start) * 1000
            )
            
            # Fix — get first arg cleanly
            input_str = str(args[0]) \
                if args else str(kwargs)
            
            def send():
                client = MindphorClient(api_key)
                client.post("/api/ingest", {
                    "api_key": api_key,
                    "input": input_str,
                    "output": str(result),
                    "model": model,
                    "user_id": user_id or "anonymous",
                    "latency_ms": latency_ms
                })
            
            thread = threading.Thread(
                target=send,
                daemon=True
            )
            thread.start()
            
            return result
        
        return wrapper
    return decorator
