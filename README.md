# Student Ledger — deploy to Vercel

A static site (`index.html`) plus a small `middleware.js` that adds a free username/password
gate. Your expense data lives in your browser's local storage, tied to your Vercel URL —
once deployed, that URL never changes, so future code updates never touch your data again.

## 1. Push it to GitHub

```bash
cd ledger-deploy
git init
git add .
git commit -m "Student ledger"
```

Create a new empty repo on github.com (no README, no .gitignore — just the bare repo), then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## 2. Deploy on Vercel

1. Go to vercel.com and sign in (GitHub login works, no separate signup).
2. Click **Add New → Project**.
3. Select the repo you just pushed.
4. Leave settings as default — Vercel will detect `package.json` and `middleware.js` automatically.
5. Click **Deploy**.

You'll get a live URL like `your-ledger.vercel.app`. This is now your permanent address —
bookmark it.

## 3. Turn on the password

1. In the Vercel dashboard, open your project → **Settings → Environment Variables**.
2. Add two variables:
   - `LEDGER_USER` → pick any username
   - `LEDGER_PASSWORD` → pick any password
3. Go to **Deployments**, click the **⋯** menu on the latest deployment, and choose **Redeploy**
   (env vars only apply after a fresh deploy).
4. Next time you open your URL, your browser will show a native login prompt asking for that
   username and password before it shows anything.

Change the password anytime by updating `LEDGER_PASSWORD` in the same settings page and
redeploying.

## 4. Making changes later

Edit any file in VS Code, then:

```bash
git add .
git commit -m "describe your change"
git push
```

Vercel redeploys automatically within seconds. Same URL, same password, same data —
every time.

## Note on your data

Your entries live in your browser's local storage for the `vercel.app` domain — not in
this repo, and not on Vercel's servers. Use the **Email this month's statement** button
inside the app whenever you want a backup copy in your inbox.
