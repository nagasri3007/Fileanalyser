# Deployment Guide for Vercel

This project is built with Next.js, Prisma, and Tailwind CSS. Follow these steps to deploy it on Vercel.

## Prerequisites
1.  **GitHub Account**: To host your code.
2.  **Vercel Account**: To deploy the app.

## Step 1: Push to GitHub

1.  Initialize git in your project folder (if not already done):
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  Create a new repository on GitHub.
3.  Link and push your code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git branch -M main
    git push -u origin main
    ```

## Step 2: Configure Database (Vercel Postgres)

Since we are using Prisma, we need a PostgreSQL database for production (SQLite is for local dev only).

1.  Go to your Vercel Dashboard.
2.  Click **"Storage"** -> **"Create Database"** -> **"Postgres"**.
3.  Give it a name (e.g., `file-analyzer-db`) and create it.
4.  Once created, go to the **".env.local"** tab in the database page.
5.  Copy the connection details. You will need `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`.

## Step 3: Deploy to Vercel

1.  Go to Vercel Dashboard -> **"Add New..."** -> **"Project"**.
2.  Import your GitHub repository.
3.  **Environment Variables**:
    *   Add `DATABASE_URL`. Set it to the value of `POSTGRES_PRISMA_URL` from the previous step.
    *   Add `GEMINI_API_KEY` and set it to your Gemini API key (you provided this earlier).
    *   *(Optional)* If you want separate pooling, check Prisma docs, but usually just `DATABASE_URL` is enough.
4.  **Build Command**: Leave as default (`next build`).
5.  **Install Command**: Leave as default (`npm install`).
6.  Click **Deploy**.

## Step 4: Update Schema for Production

By default, the project is configured for `sqlite`. For Vercel, you must switch to `postgresql`.

**Before deploying**, open `prisma/schema.prisma` and change:

```prisma
datasource db {
  provider = "postgresql" // Change from "sqlite"
}
```

(Note: Ensure `url` is removed from schema if you are using `prisma.config.ts`, or follow Prisma 7+ guides. If you encounter issues, standard practice is to use `url = env("DATABASE_URL")` in schema and remove `prisma.config.ts` if it conflicts.)

**Important**: After changing the provider, you might need to run `npx prisma generate` locally again if you want to test, but Vercel will run it automatically during build.

## Step 5: File Storage Warning

This demo stores small files in the database.
*   **Limitation**: Vercel Postgres has storage limits. Large files (>5MB) might fail or bloat the DB.
*   **Recommendation**: For a production app, use **Vercel Blob** for file storage.

## Troubleshooting

-   **Prisma Error**: If deployment fails with Prisma errors, ensure `npx prisma generate` is in the build command (Next.js does this automatically usually).
-   **Database Connection**: Ensure your IP isn't blocked if running migrations locally against Vercel DB.
