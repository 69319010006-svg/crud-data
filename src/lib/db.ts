import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const rawUrl = process.env.DATABASE_URL;
    // บน Windows เมื่อเชื่อมต่อไปยัง WSL พอร์ต 5432 ต้องใช้ 127.0.0.1 เสมอ
    const connectionString = rawUrl ? rawUrl.replace('172.24.170.22', '127.0.0.1') : undefined;

    const config: PoolConfig = connectionString
      ? {
          connectionString,
          ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        }
      : {
          host: (process.env.PGHOST || '127.0.0.1').replace('172.24.170.22', '127.0.0.1'),
          port: parseInt(process.env.PGPORT || '5432', 10),
          user: process.env.PGUSER || 'rytc',
          password: process.env.PGPASSWORD || 'rytc',
          database: process.env.PGDATABASE || 'rytc',
          ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        };

    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }
  return pool;
}

export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> {
  const p = getPool();
  return p.query<R>(text, params);
}

// สร้างตาราง student อัตโนมัติหากยังไม่มี
export async function initDB() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS student (
      sid VARCHAR(50) PRIMARY KEY,
      sname VARCHAR(100) NOT NULL,
      phone VARCHAR(50)
    );
  `;
  await query(createTableQuery);
}

export default getPool;
