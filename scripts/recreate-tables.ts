import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function recreate() {
  const query = `
    DROP TABLE IF EXISTS workforce_quizzes CASCADE;
    DROP TABLE IF EXISTS workforce_jobs CASCADE;
    DROP TABLE IF EXISTS workforce_entries CASCADE;
    DROP TABLE IF EXISTS workforce_stops CASCADE;
    DROP TABLE IF EXISTS workforce_pathways CASCADE;

    CREATE TABLE workforce_pathways (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tag TEXT,
        color TEXT,
        mark TEXT,
        shelf TEXT,
        tagline TEXT,
        intro TEXT
    );

    CREATE TABLE workforce_stops (
        id TEXT PRIMARY KEY,
        pathway_id TEXT NOT NULL REFERENCES workforce_pathways(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        mark TEXT,
        color TEXT,
        blurb TEXT
    );

    CREATE TABLE workforce_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pathway_id TEXT NOT NULL REFERENCES workforce_pathways(id) ON DELETE CASCADE,
        stop_id TEXT NOT NULL REFERENCES workforce_stops(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        subtitle TEXT,
        call_no TEXT,
        type TEXT,
        media_fallback TEXT,
        body_html TEXT,
        facts JSONB DEFAULT '[]'::jsonb,
        sources JSONB DEFAULT '[]'::jsonb,
        images JSONB DEFAULT '[]'::jsonb,
        status TEXT DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE workforce_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pathway_id TEXT REFERENCES workforce_pathways(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        organization TEXT,
        location TEXT,
        employment_type TEXT,
        url TEXT,
        note TEXT,
        posted_at TEXT,
        is_active BOOLEAN DEFAULT true
    );

    CREATE TABLE workforce_quizzes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pathway_id TEXT REFERENCES workforce_pathways(id) ON DELETE CASCADE,
        stop_id TEXT REFERENCES workforce_stops(id) ON DELETE CASCADE,
        prompt TEXT,
        pick TEXT,
        result TEXT,
        optional BOOLEAN DEFAULT false,
        allow_custom BOOLEAN DEFAULT false,
        custom_label TEXT,
        options JSONB DEFAULT '[]'::jsonb
    );
  `;

  // We have to use the RPC approach if pg function doesn't exist, but we can't run raw SQL from client easily unless we have a function. 
  // Wait, I can just use supabase.rpc('exec_sql') if it exists, or I can use postgres.js to connect directly using the connection string.
}

recreate();
