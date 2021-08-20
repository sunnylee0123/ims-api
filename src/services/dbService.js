const { Pool } = require('pg');
const logger = require('../util/log');

const { PGHOST, PGUSER, PGDATABASE, PGPASSWORD, PGPORT } = process.env;
let pool;
function getPool() {
  if (pool) return pool;

  pool = new Pool({
    user: PGUSER,
    password: PGPASSWORD,
    host: PGHOST,
    database: PGDATABASE,
    port: Number(PGPORT),
    max: 10,
  });
  return pool;
}

async function postgresConnect(server) {
  try {
    const pool_init = await getPool();
    await pool_init.connect();
  } catch (ex) {
    logger.error("[DB SERVICE]: Failed to initiate Postgres DB: ", ex);
  }
}

module.exports = {
  postgresConnect,
  getPool,
};
