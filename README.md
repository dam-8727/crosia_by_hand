# Crosia by Hand

Online woollen crochet store — **Every loop made with love**.

## Stack

- **Frontend:** React.js (Vite) → Netlify (`client/`)
- **Backend:** Node.js + Express → Render (`server/`)
- **Database:** MongoDB Atlas
- **Payments:** Razorpay (coming next)

## One repo

| Host | Directory |
|------|-----------|
| Netlify | `client` |
| Render | `server` |

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env — paste your MongoDB Atlas URI and a JWT_SECRET
npm install
npm run dev
```

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

## GitHub

https://github.com/dam-8727/crosia_by_hand.git
