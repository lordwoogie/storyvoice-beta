# StoryVoice Beta

AI-powered children's book reader that clones a family member's voice and reads stories aloud.

## Quick Deploy to Vercel

### 1. Prerequisites
- A [Vercel](https://vercel.com) account (free)
- A [GitHub](https://github.com) account
- An [ElevenLabs](https://elevenlabs.io) account (Starter plan, $5/mo)

### 2. Push to GitHub
Create a new repo on GitHub (e.g., `storyvoice-beta`), then:

```bash
cd storyvoice-app
git init
git add -A
git commit -m "Initial StoryVoice beta"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/storyvoice-beta.git
git push -u origin main
```

### 3. Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `storyvoice-beta` GitHub repo
3. Before deploying, add **Environment Variables**:
   - `ELEVENLABS_API_KEY` = your ElevenLabs API key
   - `ACCESS_CODE` = any code you want testers to enter (e.g., `thunder2026`)
4. Click **Deploy**

### 4. Share with Testers
Once deployed, Vercel gives you a URL like `storyvoice-beta.vercel.app`.
Send testers:
- The URL
- The access code you set

That's it. They enter the code, record their voice, pick a story, and listen.

## Project Structure
```
storyvoice-app/
├── api/
│   ├── clone.js      # Proxies voice cloning to ElevenLabs
│   └── speak.js      # Proxies text-to-speech to ElevenLabs
├── public/
│   └── index.html    # The frontend app
├── vercel.json        # Vercel routing config
├── .env.example       # Environment variable template
└── README.md
```

## Environment Variables
| Variable | Description |
|----------|-------------|
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key (keep secret!) |
| `ACCESS_CODE` | Code testers enter to use the app |

## Costs
- Vercel hosting: **Free** (hobby tier)
- ElevenLabs Starter: **$5/mo** (30,000 credits)
- Each story page narration uses ~150-300 credits
- A full 6-page story uses ~1,000-1,800 credits
- 30,000 credits ≈ 15-30 full story readings per month
