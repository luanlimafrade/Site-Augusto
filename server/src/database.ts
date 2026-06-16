import mysql, {
  type ResultSetHeader,
  type RowDataPacket
} from "mysql2/promise";
import { config } from "./config.js";
import type { RsvpInput } from "./validation.js";

type RsvpRow = RowDataPacket & {
  id: number;
  name: string;
  phone: string;
  attending: number | boolean;
  party_size: number;
  invitee_names: string | null;
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type RsvpRecord = {
  id: number;
  name: string;
  phone: string;
  attending: boolean;
  partySize: number;
  inviteeNames: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false,
  timezone: "Z"
});

function assertSafeDatabaseName(name: string) {
  if (!/^[a-zA-Z0-9_$]+$/.test(name)) {
    throw new Error("DB_NAME deve conter apenas letras, números, _ ou $.");
  }
}

function toIso(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return new Date(normalized).toISOString();
}

function mapRow(row: RsvpRow): RsvpRecord {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    attending: Boolean(row.attending),
    partySize: row.party_size,
    inviteeNames: row.invitee_names || "",
    notes: row.notes || "",
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

export async function initDatabase() {
  assertSafeDatabaseName(config.database.name);

  if (config.database.autoCreate) {
    const bootstrap = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      timezone: "Z"
    });

    await bootstrap.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await bootstrap.end();
  }

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(180) NOT NULL,
      phone VARCHAR(40) NOT NULL,
      attending TINYINT(1) NOT NULL,
      party_size INT UNSIGNED NOT NULL DEFAULT 0,
      invitee_names TEXT NULL,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_rsvps_name (name),
      INDEX idx_rsvps_attending (attending)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export async function createRsvp(input: RsvpInput) {
  const [result] = await pool.execute<ResultSetHeader>(
    `
      INSERT INTO rsvps (name, phone, attending, party_size, invitee_names, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      input.name,
      input.phone,
      input.attending ? 1 : 0,
      input.attending ? input.partySize : 0,
      input.inviteeNames || null,
      input.notes || null
    ]
  );

  return getRsvp(result.insertId);
}

export async function getRsvp(id: number) {
  const [rows] = await pool.execute<RsvpRow[]>(
    "SELECT * FROM rsvps WHERE id = ?",
    [id]
  );

  const row = rows[0];

  if (!row) {
    throw new Error("Confirmação não encontrada.");
  }

  return mapRow(row);
}

export async function listRsvps() {
  const [rows] = await pool.execute<RsvpRow[]>(
    "SELECT * FROM rsvps ORDER BY created_at DESC, id DESC"
  );

  return rows.map(mapRow);
}

export async function updateRsvp(id: number, input: RsvpInput) {
  const [result] = await pool.execute<ResultSetHeader>(
    `
      UPDATE rsvps
      SET name = ?,
          phone = ?,
          attending = ?,
          party_size = ?,
          invitee_names = ?,
          notes = ?
      WHERE id = ?
    `,
    [
      input.name,
      input.phone,
      input.attending ? 1 : 0,
      input.attending ? input.partySize : 0,
      input.inviteeNames || null,
      input.notes || null,
      id
    ]
  );

  if (result.affectedRows === 0) {
    throw new Error("Confirmação não encontrada.");
  }

  return getRsvp(id);
}

export async function deleteRsvp(id: number) {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM rsvps WHERE id = ?",
    [id]
  );

  return result.affectedRows > 0;
}

export async function getStats() {
  const rsvps = await listRsvps();

  return {
    totalResponses: rsvps.length,
    totalAttending: rsvps.filter((rsvp) => rsvp.attending).length,
    totalNotAttending: rsvps.filter((rsvp) => !rsvp.attending).length,
    totalGuests: rsvps.reduce(
      (sum, rsvp) => sum + (rsvp.attending ? rsvp.partySize : 0),
      0
    )
  };
}
