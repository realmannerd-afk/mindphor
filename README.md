# Mindphor

> Know when your AI breaks. Before your users do.

Mindphor is a production monitoring platform for AI applications.
Track every LLM call, score outputs in real time, detect memory
drift, and get alerted when quality drops — before your users
notice.

---

## Why Mindphor

When a normal app breaks in production, you get an error log.
When an AI app breaks, you get nothing. The app didn't crash.
It just gave a wrong answer. Silently. To a real user.

Mindphor fixes that.

---

## Features

- **Output scoring** — every AI call scored 0–100 for
  relevance, accuracy, and consistency
- **Memory tracking** — monitor user context, detect stale
  or contradictory memory keys
- **Hallucination detection** — automatic flagging when AI
  states something false
- **Quality alerts** — instant alerts when scores drop
  below your threshold
- **Trend dashboard** — visualize quality over time, spot
  regressions after prompt changes
- **Zero latency impact** — SDK runs async, never slows
  your app

---

## How It Works
Your AI app runs normally
↓
@track intercepts each LLM call
↓
Input + output sent to Mindphor API
↓
Judge model scores the output
↓
Score + alerts appear on dashboard

---

## Quick Start

### 1. Sign up

Create your free account and copy your API key from Settings.

### 2. Install the SDK

```bash
pip install git+https://github.com/realmannerd-afk/mindphor.git#subdirectory=sdk
```

### 3. Add @track to your AI function

```python
from mindphor import track

@track(
    api_key="mp_your_key_here",
    model="gpt-4",
    user_id="user_123"
)
def ask_ai(question: str) -> str:
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": question}]
    )
    return response.choices[0].message.content
```

That's it. Every call is now monitored.

### 4. Track memory (optional)

```python
from mindphor import Memory

mem = Memory(api_key="mp_your_key_here")

# Store user context
mem.set(user_id="user_123", key="plan", value="pro")

# Mindphor alerts you if this goes stale
# or if a contradiction is detected
```

---

## SDK Reference

### @track decorator

| Parameter | Required | Description |
|---|---|---|
| api_key | Yes | Your Mindphor API key |
| model | No | Model name for display |
| user_id | No | Track per user |

### Memory class

```python
mem = Memory(api_key="mp_xxx")

mem.set(user_id, key, value)   # store a key
mem.get(user_id)               # get all keys
mem.delete(user_id, key)       # delete a key
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Astro + Svelte + Tailwind CSS |
| Backend | Astro API Routes |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| Scorer | Cerebras LLM |
| SDK | Python |

---

## Roadmap

- [ ] Node.js SDK
- [ ] Slack + email alerts
- [ ] Custom eval criteria
- [ ] Multi-project support
- [ ] Self-hosted option

---

## License

MIT