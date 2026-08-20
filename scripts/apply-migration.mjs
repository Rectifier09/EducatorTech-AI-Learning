// Apply a SQL migration file to Supabase via the Management API.
// Usage: node --env-file=.env.local scripts/apply-migration.mjs supabase/migrations/0001_init.sql
// (or: npm run db:migrate -- supabase/migrations/0001_init.sql)
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: apply-migration.mjs <path-to.sql>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!url || !token) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_ACCESS_TOKEN in env");
  process.exit(1);
}

const ref = new URL(url).hostname.split(".")[0];
const query = readFileSync(file, "utf8");

const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
);

if (res.ok) {
  console.log(`✅ applied ${file}`);
} else {
  console.error(`❌ failed (HTTP ${res.status}):`, await res.text());
  process.exit(1);
}
