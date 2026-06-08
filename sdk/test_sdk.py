# Test the SDK end to end against
# the live Vercel deployment.

import time
from mindphor import track, Memory

API_KEY = "mp_8ca6b5be099b465b89b643ccd380344b"

# Test 1 — @track decorator
print("Test 1 — testing @track...")

@track(
    api_key=API_KEY,
    model="gpt-4",
    user_id="sdk_test_user"
)
def fake_ai(question):
    return "This is a test AI response."

result = fake_ai("What is the return policy?")
print(f"Function returned: {result}")
print("Waiting 6 seconds for scoring...")
time.sleep(6)
print("✅ Check mindphor.vercel.app/dashboard")
print("   You should see a new trace.")

# Test 2 — Memory
print("\nTest 2 — testing memory...")

mem = Memory(api_key=API_KEY)
mem.set("sdk_test_user", "plan", "pro")
print("✅ Memory key set")

keys = mem.get(user_id="sdk_test_user")
print(f"✅ Memory keys retrieved: {keys}")

# Wait for background thread to finish
print("\nWaiting for background threads...")
time.sleep(3)
print("Done.")
