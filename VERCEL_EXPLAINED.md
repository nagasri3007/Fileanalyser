# What is Vercel?

Think of **Vercel** as a "publisher" for your code. 

When you write code (like the `Fileanalyser` app we just built), it lives on your computer. For other people to see and use it, it needs to live on a server on the internet. Vercel provides that server and makes the process incredibly simple.

## Why is it special?
1.  **Built for Next.js**: Vercel created Next.js (the framework we used). They work perfectly together.
2.  **Zero Configuration**: Usually, setting up a server involves complex commands. Vercel just "figures it out" automatically.
3.  **Automatic Updates**: Every time you save changes to your code (specifically, when you push to GitHub), Vercel automatically updates your live website in seconds.

## How does it work?
The workflow is simple:
1.  **You** write code on your computer.
2.  **You** upload (push) that code to **GitHub** (a code storage site).
3.  **Vercel** watches your GitHub. When it sees new code, it grabs it, builds your website, and puts it online with a URL (like `fileanalyser.vercel.app`).

---

# How to Use It (Step-by-Step)

## 1. You need a GitHub Account
Verce primarily works by connecting to GitHub.
*   Go to [github.com](https://github.com) and sign up if you haven't already.
*   Create a **New Repository** (call it `file-analyser`).

## 2. Upload your code to GitHub
We've already prepared your code. You just need to run these commands in your terminal to send it to GitHub:
```bash
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/file-analyser.git
git branch -M main
git push -u origin main
```

## 3. Connect Vercel
1.  Go to [vercel.com](https://vercel.com) and sign up (login with GitHub is easiest).
2.  Click **"Add New..."** -> **"Project"**.
3.  You will see your `file-analyser` repo from GitHub. Click **Import**.

## 4. Configure & Deploy
Vercel needs to know about your "secrets" (like your API keys).
*   In the configuration screen, find **Environment Variables**.
*   Add `GEMINI_API_KEY` (paste your key).
*   Add `DATABASE_URL` (requires a database setup, see `DEPLOY.md` for details).
*   Click **Deploy**.

That's it! Vercel will give you a live link to share with the world.
