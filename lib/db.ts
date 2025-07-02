import { Pool } from "pg"

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Experess",
  password: "1234567890",
  port: 5432,
})

export { pool }
