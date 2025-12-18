# ShootFlow Database Setup Guide

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project (name it "shootflow")
4. Wait for the project to be ready (~2 minutes)

## Step 2: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` file
3. Paste and run it in the SQL Editor
4. This will create the `shoots` and `catalog_items` tables

## Step 3: Get Your API Keys

1. Go to **Project Settings** > **API**
2. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy the **anon public** key (long string starting with `eyJ...`)

## Step 4: Add Environment Variables to Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Variables** tab
4. Add these two variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

5. Railway will automatically redeploy with the new variables

## Step 5: For Local Development

Create a `.env` file in your project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## That's it!

Once configured, all data will be stored in Supabase and shared across all users and devices.

