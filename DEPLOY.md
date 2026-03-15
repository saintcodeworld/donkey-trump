# Render Deployment Guide

## Quick Deploy to Render

This application is configured for **one-click deployment** to Render with everything (backend + frontend + WebSocket) in a single service.

### Prerequisites

1. **GitHub Account** - Push this repo to GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Supabase Project** - Get your URL and service key
4. **Solana Wallet** - Dev wallet private key (base58 encoded)

---

## Deployment Steps

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Render will **auto-detect** `render.yaml` configuration

### 3. Configure Environment Variables

In the Render dashboard, add these environment variables:

#### Required Variables:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
DEVWALLET_PRIVATE_KEY=your_base58_private_key_here
```

#### Optional Variables (defaults provided):
```
PUMPFUN_TOKEN_ADDRESS=your_token_mint_address
PUMPFUN_BUY_AMOUNT_SOL=0.01
SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Note:** PORT and NODE_ENV are set automatically by `render.yaml`

### 4. Deploy

Click **"Create Web Service"** - Render will:
- Install dependencies (`npm install`)
- Start the server (`node server.js`)
- Assign a public URL (e.g., `https://your-app.onrender.com`)

---

## What Gets Deployed

✅ **Backend API** - All `/api/*` endpoints  
✅ **Frontend** - Static files from `/web/` directory  
✅ **WebSocket Server** - Real-time chat functionality  
✅ **Game Assets** - Images, audio, fonts from `/assets/`  
✅ **Solana Integration** - Transaction processing  

---

## Post-Deployment

### Access Your App
```
https://your-app-name.onrender.com
```

### Update Supabase Schema
Run the SQL in `supabase_schema.sql` in your Supabase SQL editor to create required tables.

### Test WebSocket
The chat feature should work automatically - no additional configuration needed.

### Monitor Logs
View real-time logs in Render dashboard under **"Logs"** tab.

---

## Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL | - |
| `SUPABASE_SERVICE_KEY` | ✅ | Service role key (not anon key) | - |
| `DEVWALLET_PRIVATE_KEY` | ✅ | Base58 encoded Solana private key | - |
| `PUMPFUN_TOKEN_ADDRESS` | ❌ | Token mint address for rewards | - |
| `PUMPFUN_BUY_AMOUNT_SOL` | ❌ | SOL amount per token buy | 0.01 |
| `SOLANA_RPC_URL` | ❌ | Solana RPC endpoint | devnet |
| `PORT` | ❌ | Server port (auto-set by Render) | 10000 |
| `NODE_ENV` | ❌ | Environment mode | production |

---

## Troubleshooting

### Build Fails
- Check that `package.json` exists and has all dependencies
- Verify Node.js version compatibility

### WebSocket Not Working
- Ensure your Render plan supports WebSocket (Free tier does)
- Check browser console for connection errors

### Database Errors
- Verify Supabase credentials are correct
- Ensure tables are created using `supabase_schema.sql`

### Solana Transaction Errors
- Check `DEVWALLET_PRIVATE_KEY` is base58 encoded
- Verify wallet has sufficient SOL balance
- Confirm RPC URL is accessible

---

## Free Tier Limitations

Render Free tier includes:
- ✅ 750 hours/month runtime
- ✅ WebSocket support
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold start delay (~30 seconds)

**Upgrade to Starter ($7/mo)** for:
- Always-on service
- No cold starts
- Better performance

---

## Custom Domain (Optional)

1. Go to **Settings** → **Custom Domain**
2. Add your domain (e.g., `game.yourdomain.com`)
3. Update DNS records as instructed
4. SSL certificate auto-provisioned

---

## Continuous Deployment

Every push to your GitHub `main` branch will automatically trigger a new deployment on Render.

To disable auto-deploy:
1. Go to **Settings** → **Build & Deploy**
2. Toggle **"Auto-Deploy"** off

---

## Support

- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Solana Docs**: https://docs.solana.com

---

## Security Notes

🔒 **Never commit `.env` file to Git**  
🔒 **Use Render's environment variables for secrets**  
🔒 **Keep `DEVWALLET_PRIVATE_KEY` secure**  
🔒 **Use service role key, not anon key for Supabase**
