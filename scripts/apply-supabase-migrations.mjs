import fs from 'node:fs/promises';
import path from 'node:path';

const token = process.env.SUPABASE_ACCESS_TOKEN;
const project = process.env.SUPABASE_PROJECT_ID;
if (!token || !project) {
  console.error('Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_ID.');
  process.exit(1);
}

const dir = 'supabase/migrations';
const endpoint = `https://api.supabase.com/v1/projects/${project}/database/query`;

async function query(sql) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Supabase query failed (${res.status}): ${text.slice(0, 1000)}`);
  }
  return text;
}

const files = (await fs.readdir(dir))
  .filter((file) => file.endsWith('.sql'))
  .sort();

for (const file of files) {
  const version = file.split('_')[0];
  const name = file.slice(file.indexOf('_') + 1).replace(/\.sql$/, '');
  const existing = JSON.parse(await query(
    `select version from supabase_migrations.schema_migrations where version = '${version}'`
  ));
  if (existing.length) {
    console.log(`skip ${file}`);
    continue;
  }

  const content = await fs.readFile(path.join(dir, file), 'utf8');
  await query(content);
  const escaped = content.replace(/'/g, "''");
  await query(
    `insert into supabase_migrations.schema_migrations(version, statements, name)
     values ('${version}', array['${escaped}']::text[], '${name}')`
  );
  console.log(`applied ${file}`);
}
