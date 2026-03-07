import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://elw@localhost:5432/thulobazaar' });
const { rows } = await pool.query("SELECT id, name, slug, type, parent_id FROM locations ORDER BY type DESC, parent_id ASC NULLS FIRST, name ASC");
rows.forEach(c => console.log(JSON.stringify(c)));
await pool.end();
