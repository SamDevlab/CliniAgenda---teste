import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const schema = `
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS confirmed_appointment_slot
    ON appointments (date, time)
    WHERE status = 'CONFIRMED';

  CREATE INDEX IF NOT EXISTS appointments_date_index ON appointments (date);
  CREATE INDEX IF NOT EXISTS appointments_status_index ON appointments (status);
`;

type SqlParameters = unknown[] | Record<string, unknown>;

export interface SqliteStatement {
  run(parameters?: SqlParameters): { lastInsertRowid: number };
  get(parameters?: SqlParameters): Record<string, unknown> | undefined;
  all(parameters?: SqlParameters): Array<Record<string, unknown>>;
}

function normalizeParameters(parameters?: SqlParameters): unknown[] | Record<string, unknown> | undefined {
  if (!parameters || Array.isArray(parameters)) return parameters;
  return Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key.replace(/^[@:$]/, ""), value]));
}

export class SqliteDatabase {
  private transactionDepth = 0;
  private dirty = false;

  private constructor(
    private readonly database: SqlJsDatabase,
    private readonly databasePath: string,
  ) {}

  static async open(databasePath: string): Promise<SqliteDatabase> {
    const SQL = await initSqlJs({
      locateFile: (file) => path.join(path.dirname(require.resolve("sql.js")), file),
    });
    let database: SqlJsDatabase;
    if (databasePath !== ":memory:" && fs.existsSync(databasePath)) {
      database = new SQL.Database(new Uint8Array(fs.readFileSync(databasePath)));
    } else {
      database = new SQL.Database();
    }

    const sqlite = new SqliteDatabase(database, databasePath);
    sqlite.exec(schema);
    return sqlite;
  }

  prepare(sql: string): SqliteStatement {
    return {
      run: (parameters) => {
        const statement = this.database.prepare(sql);
        try {
          statement.bind(normalizeParameters(parameters));
          while (statement.step()) { /* A execução pode retornar linhas, mas INSERT não as utiliza. */ }
        } finally {
          statement.free();
        }
        this.markDirty();
        const row = this.database.exec("SELECT last_insert_rowid() AS id")[0]?.values[0]?.[0];
        return { lastInsertRowid: Number(row || 0) };
      },
      get: (parameters) => {
        const statement = this.database.prepare(sql);
        try {
          statement.bind(normalizeParameters(parameters));
          return statement.step() ? statement.getAsObject() as Record<string, unknown> : undefined;
        } finally {
          statement.free();
        }
      },
      all: (parameters) => {
        const statement = this.database.prepare(sql);
        const rows: Array<Record<string, unknown>> = [];
        try {
          statement.bind(normalizeParameters(parameters));
          while (statement.step()) rows.push(statement.getAsObject() as Record<string, unknown>);
        } finally {
          statement.free();
        }
        return rows;
      },
    };
  }

  exec(sql: string): void {
    this.database.run(sql);
    this.markDirty();
  }

  transaction<T>(callback: () => T): T {
    this.database.run("BEGIN IMMEDIATE");
    this.transactionDepth += 1;
    try {
      const result = callback();
      this.database.run("COMMIT");
      this.transactionDepth -= 1;
      this.persist();
      return result;
    } catch (error) {
      this.database.run("ROLLBACK");
      this.transactionDepth = 0;
      throw error;
    }
  }

  close(): void {
    this.persist();
    this.database.close();
  }

  private markDirty(): void {
    this.dirty = true;
    if (this.transactionDepth === 0) this.persist();
  }

  private persist(): void {
    if (!this.dirty || this.databasePath === ":memory:") return;
    fs.mkdirSync(path.dirname(path.resolve(this.databasePath)), { recursive: true });
    fs.writeFileSync(this.databasePath, Buffer.from(this.database.export()));
    this.dirty = false;
  }
}

export async function createDatabase(databasePath: string): Promise<SqliteDatabase> {
  return SqliteDatabase.open(databasePath);
}

