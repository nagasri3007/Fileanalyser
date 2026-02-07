
# ⚡ Setting up Supabase (MANDATORY)

Since you are using Supabase (`https://smbpnfoyczmjnjqkpjnl.supabase.co`), you must create the tables and storage buckets manually in your Supabase Dashboard because we are not using Prisma migrations (which require a database password).

Follow these steps exactly:

## 1. Go to Supabase Dashboard
1.  Log in to [supabase.com](https://supabase.com).
2.  Open your project: `smbpnfoyczmjnjqkpjnl`.

## 2. Run SQL to Create Table
1.  Click on the **SQL Editor** icon (on the left sidebar, looks like a terminal `>_`).
2.  Click **"New Query"**.
3.  Paste the following code and click **Run**:

```sql
-- Create the Analysis table
CREATE TABLE "Analysis" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  filename TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  size BIGINT,
  
  -- Metadata
  title TEXT,
  "wordCount" INT,
  "pageCount" INT,
  resolution TEXT,
  dimensions TEXT,
  
  -- Analysis Results
  summary TEXT,
  keywords TEXT, -- Comma separated
  sentiment TEXT,
  complexity FLOAT,
  
  -- File Storage
  content_url TEXT,
  content BYTEA -- Legacy field, can remain null
);

-- Enable Row Level Security (RLS) - Optional for public demo flexibility, but good practice
ALTER TABLE "Analysis" ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (FOR DEMO/DEV ONLY)
CREATE POLICY "Public Access" ON "Analysis" FOR ALL USING (true) WITH CHECK (true);
```

4.  Wait for "Success" message.

## 3. Create Storage Bucket
1.  Click on the **Storage** icon (left sidebar, looks like a folder).
2.  Click **"New Bucket"**.
3.  Name it: `files`.
4.  **Important**: Check "Public Bucket" (so files can be downloaded via URL).
5.  Click **Save**.
6.  Go to the **"Configuration"** or **"Policies"** tab of the bucket.
7.  Ensure you add a policy to allow uploads:
    *   Click "New Policy" -> "For full customization".
    *   Name: `Public Upload`.
    *   Allowed operations: `SELECT`, `INSERT`, `UPDATE`.
    *   Target roles: `anon` (or just check all).
    *   Click **Review** and **Save**.

## 4. Verify
Your app is now ready! The keys you provided (`sb_publishable...` and `sb_secret...`) are already configured in your code.
