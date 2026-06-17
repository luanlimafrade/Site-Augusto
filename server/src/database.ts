import mysql, {
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket
} from "mysql2/promise";
import crypto from "node:crypto";
import { config } from "./config.js";
import type { GiftGroupInput, GiftInput, RsvpInput } from "./validation.js";

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

type GiftGroupRow = RowDataPacket & {
  id: number;
  name: string;
  description: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type GiftRow = RowDataPacket & {
  id: number;
  group_id: number;
  group_name?: string;
  name: string;
  image_url: string;
  image_fit: string | null;
  image_position: string | null;
  price_cents: number;
  purchase_status: string | null;
  reserved_until: Date | string | null;
  sold_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type GiftOrderRow = RowDataPacket & {
  id: number;
  gift_id: number;
  gift_name: string;
  group_name: string;
  status: string;
  amount_cents: number;
  external_reference: string;
  preference_id: string | null;
  init_point: string | null;
  mp_payment_id: string | null;
  mp_status: string | null;
  mp_status_detail: string | null;
  reserved_until: Date | string | null;
  approved_at: Date | string | null;
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

export type GiftRecord = {
  id: number;
  groupId: number;
  groupName?: string;
  name: string;
  imageUrl: string;
  imageFit: "cover" | "contain";
  imagePosition: string;
  priceCents: number;
  purchaseStatus: "available" | "reserved" | "sold";
  reservedUntil: string | null;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GiftOrderRecord = {
  id: number;
  giftId: number;
  giftName: string;
  groupName: string;
  status:
    | "reserved"
    | "checkout_pending"
    | "approved"
    | "rejected"
    | "expired"
    | "cancelled";
  amountCents: number;
  externalReference: string;
  preferenceId: string;
  initPoint: string;
  mpPaymentId: string;
  mpStatus: string;
  mpStatusDetail: string;
  reservedUntil: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GiftCheckoutRecord = {
  order: GiftOrderRecord;
  checkoutUrl: string;
  message: string;
};

export type GiftCheckoutReservation = GiftCheckoutRecord & {
  gift: GiftRecord;
};

export type MercadoPagoPaymentInput = {
  id: string;
  status: string;
  statusDetail: string;
  externalReference: string;
  amountCents: number;
  currencyId: string;
};

export type GiftGroupRecord = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  gifts: GiftRecord[];
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

function toIsoOrNull(value: Date | string | null) {
  return value ? toIso(value) : null;
}

function normalizeGiftStatus(
  status: string | null
): GiftRecord["purchaseStatus"] {
  if (status === "reserved" || status === "sold") {
    return status;
  }

  return "available";
}

function normalizeGiftInputStatus(
  status: GiftInput["purchaseStatus"]
): GiftRecord["purchaseStatus"] {
  return status === "reserved" || status === "sold" ? status : "available";
}

function normalizeGiftInputFit(fit: GiftInput["imageFit"]) {
  return fit === "cover" ? "cover" : "contain";
}

function normalizeOrderStatus(status: string): GiftOrderRecord["status"] {
  const allowed: GiftOrderRecord["status"][] = [
    "reserved",
    "checkout_pending",
    "approved",
    "rejected",
    "expired",
    "cancelled"
  ];

  return allowed.includes(status as GiftOrderRecord["status"])
    ? (status as GiftOrderRecord["status"])
    : "reserved";
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

function mapGift(row: GiftRow): GiftRecord {
  return {
    id: row.id,
    groupId: row.group_id,
    groupName: row.group_name,
    name: row.name,
    imageUrl: row.image_url,
    imageFit: row.image_fit === "cover" ? "cover" : "contain",
    imagePosition: row.image_position || "center center",
    priceCents: row.price_cents,
    purchaseStatus: normalizeGiftStatus(row.purchase_status),
    reservedUntil: toIsoOrNull(row.reserved_until),
    soldAt: toIsoOrNull(row.sold_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

function mapGiftOrder(row: GiftOrderRow): GiftOrderRecord {
  return {
    id: row.id,
    giftId: row.gift_id,
    giftName: row.gift_name,
    groupName: row.group_name,
    status: normalizeOrderStatus(row.status),
    amountCents: row.amount_cents,
    externalReference: row.external_reference,
    preferenceId: row.preference_id || "",
    initPoint: row.init_point || "",
    mpPaymentId: row.mp_payment_id || "",
    mpStatus: row.mp_status || "",
    mpStatusDetail: row.mp_status_detail || "",
    reservedUntil: toIsoOrNull(row.reserved_until),
    approvedAt: toIsoOrNull(row.approved_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

function mapGiftGroup(row: GiftGroupRow, gifts: GiftRecord[]): GiftGroupRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    gifts
  };
}

async function ensureColumn(table: string, column: string, definition: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [table, column]
  );

  if (rows.length === 0) {
    await pool.execute(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
  }
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

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS gift_groups (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(80) NOT NULL,
      description VARCHAR(280) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_gift_groups_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS gifts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      group_id INT UNSIGNED NOT NULL,
      name VARCHAR(120) NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      image_fit VARCHAR(12) NOT NULL DEFAULT 'contain',
      image_position VARCHAR(40) NOT NULL DEFAULT 'center center',
      price_cents INT UNSIGNED NOT NULL DEFAULT 0,
      purchase_status VARCHAR(20) NOT NULL DEFAULT 'available',
      reserved_until DATETIME NULL,
      sold_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_gifts_group_id (group_id),
      INDEX idx_gifts_purchase_status (purchase_status),
      UNIQUE KEY uq_gifts_group_name (group_id, name),
      CONSTRAINT fk_gifts_group
        FOREIGN KEY (group_id) REFERENCES gift_groups (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await ensureColumn(
    "gifts",
    "image_position",
    "image_position VARCHAR(40) NOT NULL DEFAULT 'center center' AFTER image_url"
  );

  await ensureColumn(
    "gifts",
    "image_fit",
    "image_fit VARCHAR(12) NOT NULL DEFAULT 'contain' AFTER image_url"
  );

  await pool.execute(
    "ALTER TABLE gifts MODIFY image_fit VARCHAR(12) NOT NULL DEFAULT 'contain'"
  );

  await ensureColumn(
    "gifts",
    "purchase_status",
    "purchase_status VARCHAR(20) NOT NULL DEFAULT 'available' AFTER price_cents"
  );

  await ensureColumn(
    "gifts",
    "reserved_until",
    "reserved_until DATETIME NULL AFTER purchase_status"
  );

  await ensureColumn(
    "gifts",
    "sold_at",
    "sold_at DATETIME NULL AFTER reserved_until"
  );

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS gift_orders (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      gift_id INT UNSIGNED NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'reserved',
      amount_cents INT UNSIGNED NOT NULL,
      external_reference VARCHAR(90) NOT NULL,
      preference_id VARCHAR(120) NULL,
      init_point VARCHAR(600) NULL,
      mp_payment_id VARCHAR(80) NULL,
      mp_status VARCHAR(40) NULL,
      mp_status_detail VARCHAR(120) NULL,
      reserved_until DATETIME NULL,
      approved_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_gift_orders_external_reference (external_reference),
      INDEX idx_gift_orders_gift_id (gift_id),
      INDEX idx_gift_orders_status (status),
      CONSTRAINT fk_gift_orders_gift
        FOREIGN KEY (gift_id) REFERENCES gifts (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
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

export async function listGiftGroups() {
  const [groups] = await pool.execute<GiftGroupRow[]>(
    "SELECT * FROM gift_groups ORDER BY name ASC, id ASC"
  );
  const [gifts] = await pool.execute<GiftRow[]>(
    `
      SELECT gifts.*, gift_groups.name AS group_name
      FROM gifts
      INNER JOIN gift_groups ON gift_groups.id = gifts.group_id
      ORDER BY gift_groups.name ASC, gifts.name ASC, gifts.id ASC
    `
  );

  const giftsByGroup = new Map<number, GiftRecord[]>();

  for (const gift of gifts) {
    const list = giftsByGroup.get(gift.group_id) || [];
    list.push(mapGift(gift));
    giftsByGroup.set(gift.group_id, list);
  }

  return groups.map((group) => mapGiftGroup(group, giftsByGroup.get(group.id) || []));
}

export async function createGiftGroup(input: GiftGroupInput) {
  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO gift_groups (name, description) VALUES (?, ?)",
    [input.name, input.description || null]
  );

  return getGiftGroup(result.insertId);
}

export async function getGiftGroup(id: number) {
  const [rows] = await pool.execute<GiftGroupRow[]>(
    "SELECT * FROM gift_groups WHERE id = ?",
    [id]
  );
  const row = rows[0];

  if (!row) {
    throw new Error("Grupo de presentes não encontrado.");
  }

  return mapGiftGroup(row, []);
}

export async function updateGiftGroup(id: number, input: GiftGroupInput) {
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE gift_groups SET name = ?, description = ? WHERE id = ?",
    [input.name, input.description || null, id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Grupo de presentes não encontrado.");
  }

  return getGiftGroup(id);
}

export async function deleteGiftGroup(id: number) {
  const [countRows] = await pool.execute<(RowDataPacket & { total: number })[]>(
    "SELECT COUNT(*) AS total FROM gifts WHERE group_id = ?",
    [id]
  );

  if (countRows[0]?.total > 0) {
    throw new Error("Remova os presentes deste grupo antes de excluí-lo.");
  }

  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM gift_groups WHERE id = ?",
    [id]
  );

  return result.affectedRows > 0;
}

export async function createGift(input: GiftInput) {
  const purchaseStatus = normalizeGiftInputStatus(input.purchaseStatus);

  const [result] = await pool.execute<ResultSetHeader>(
    `
      INSERT INTO gifts (
        group_id,
        name,
        image_url,
        image_fit,
        image_position,
        price_cents,
        purchase_status,
        reserved_until,
        sold_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, CASE WHEN ? = 'sold' THEN UTC_TIMESTAMP() ELSE NULL END)
    `,
    [
      input.groupId,
      input.name,
      input.imageUrl,
      normalizeGiftInputFit(input.imageFit),
      input.imagePosition || "center center",
      input.priceCents,
      purchaseStatus,
      purchaseStatus
    ]
  );

  return getGift(result.insertId);
}

export async function getGift(id: number) {
  const [rows] = await pool.execute<GiftRow[]>(
    `
      SELECT gifts.*, gift_groups.name AS group_name
      FROM gifts
      INNER JOIN gift_groups ON gift_groups.id = gifts.group_id
      WHERE gifts.id = ?
    `,
    [id]
  );
  const row = rows[0];

  if (!row) {
    throw new Error("Presente não encontrado.");
  }

  return mapGift(row);
}

export async function updateGift(id: number, input: GiftInput) {
  const current = await getGift(id);
  const purchaseStatus = normalizeGiftInputStatus(input.purchaseStatus);
  const statusChanged = current.purchaseStatus !== purchaseStatus;
  const statusDateSql = statusChanged
    ? `,
          reserved_until = NULL,
          sold_at = ${purchaseStatus === "sold" ? "UTC_TIMESTAMP()" : "NULL"}`
    : "";

  const [result] = await pool.execute<ResultSetHeader>(
    `
      UPDATE gifts
      SET group_id = ?,
          name = ?,
          image_url = ?,
          image_fit = ?,
          image_position = ?,
          price_cents = ?,
          purchase_status = ?
          ${statusDateSql}
      WHERE id = ?
    `,
    [
      input.groupId,
      input.name,
      input.imageUrl,
      normalizeGiftInputFit(input.imageFit),
      input.imagePosition || "center center",
      input.priceCents,
      purchaseStatus,
      id
    ]
  );

  if (result.affectedRows === 0) {
    throw new Error("Presente não encontrado.");
  }

  return getGift(id);
}

export async function deleteGift(id: number) {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM gifts WHERE id = ?",
    [id]
  );

  return result.affectedRows > 0;
}

type QueryExecutor = Pick<typeof pool, "execute"> | PoolConnection;

async function expireGiftReservationsWith(executor: QueryExecutor) {
  await executor.execute(
    `
      UPDATE gift_orders
      SET status = 'expired'
      WHERE status IN ('reserved', 'checkout_pending')
        AND reserved_until IS NOT NULL
        AND reserved_until < UTC_TIMESTAMP()
    `
  );

  await executor.execute(
    `
      UPDATE gifts
      SET purchase_status = 'available',
          reserved_until = NULL
      WHERE purchase_status = 'reserved'
        AND reserved_until IS NOT NULL
        AND reserved_until < UTC_TIMESTAMP()
    `
  );
}

export async function expireGiftReservations() {
  await expireGiftReservationsWith(pool);
}

function buildCheckoutUrl(externalReference: string) {
  const baseUrl = config.siteUrl.replace(/\/$/, "");
  return `${baseUrl}/presentes?pedido=${encodeURIComponent(externalReference)}`;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function getGiftOrderWith(
  executor: QueryExecutor,
  id: number
): Promise<GiftOrderRecord> {
  const [rows] = await executor.execute<GiftOrderRow[]>(
    `
      SELECT
        gift_orders.*,
        gifts.name AS gift_name,
        gift_groups.name AS group_name
      FROM gift_orders
      INNER JOIN gifts ON gifts.id = gift_orders.gift_id
      INNER JOIN gift_groups ON gift_groups.id = gifts.group_id
      WHERE gift_orders.id = ?
    `,
    [id]
  );
  const row = rows[0];

  if (!row) {
    throw new Error("Ordem de presente nÃ£o encontrada.");
  }

  return mapGiftOrder(row);
}

export async function listGiftOrders() {
  await expireGiftReservations();

  const [rows] = await pool.execute<GiftOrderRow[]>(
    `
      SELECT
        gift_orders.*,
        gifts.name AS gift_name,
        gift_groups.name AS group_name
      FROM gift_orders
      INNER JOIN gifts ON gifts.id = gift_orders.gift_id
      INNER JOIN gift_groups ON gift_groups.id = gifts.group_id
      ORDER BY gift_orders.created_at DESC, gift_orders.id DESC
    `
  );

  return rows.map(mapGiftOrder);
}

export async function createGiftCheckoutReservation(
  giftId: number
): Promise<GiftCheckoutReservation> {
  await expireGiftReservations();

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await expireGiftReservationsWith(connection);

    const [rows] = await connection.execute<GiftRow[]>(
      `
        SELECT gifts.*, gift_groups.name AS group_name
        FROM gifts
        INNER JOIN gift_groups ON gift_groups.id = gifts.group_id
        WHERE gifts.id = ?
        FOR UPDATE
      `,
      [giftId]
    );
    const row = rows[0];

    if (!row) {
      throw new Error("Presente nÃ£o encontrado.");
    }

    const gift = mapGift(row);

    if (gift.purchaseStatus === "sold") {
      throw new Error("Este presente jÃ¡ foi escolhido.");
    }

    if (gift.purchaseStatus === "reserved") {
      throw new Error("Este presente estÃ¡ em processo de escolha.");
    }

    if (gift.priceCents <= 0) {
      throw new Error("Defina um valor para ativar o checkout deste presente.");
    }

    const now = new Date();
    const reservedUntil = addMinutes(now, config.checkoutReservationMinutes);
    const externalReference = `gift-${gift.id}-${crypto.randomUUID()}`;
    const checkoutUrl = buildCheckoutUrl(externalReference);

    const [result] = await connection.execute<ResultSetHeader>(
      `
        INSERT INTO gift_orders (
          gift_id,
          status,
          amount_cents,
          external_reference,
          init_point,
          reserved_until
        )
        VALUES (?, 'reserved', ?, ?, ?, ?)
      `,
      [
        gift.id,
        gift.priceCents,
        externalReference,
        checkoutUrl,
        reservedUntil
      ]
    );

    await connection.execute(
      `
        UPDATE gifts
        SET purchase_status = 'reserved',
            reserved_until = ?,
            sold_at = NULL
        WHERE id = ?
      `,
      [reservedUntil, gift.id]
    );

    await connection.commit();

    return {
      order: await getGiftOrderWith(pool, result.insertId),
      gift,
      checkoutUrl,
      message:
        "Reserva criada. O checkout do Mercado Pago serÃ¡ conectado na prÃ³xima etapa."
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateGiftOrderCheckout(
  id: number,
  input: {
    preferenceId: string;
    checkoutUrl: string;
  }
) {
  const [result] = await pool.execute<ResultSetHeader>(
    `
      UPDATE gift_orders
      SET status = 'checkout_pending',
          preference_id = ?,
          init_point = ?
      WHERE id = ?
    `,
    [input.preferenceId, input.checkoutUrl, id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Ordem de presente nÃ£o encontrada.");
  }

  return getGiftOrderWith(pool, id);
}

export async function releaseGiftOrder(id: number) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await expireGiftReservationsWith(connection);

    const [rows] = await connection.execute<(GiftOrderRow & { gift_status: string })[]>(
      `
        SELECT
          gift_orders.*,
          gifts.name AS gift_name,
          gift_groups.name AS group_name,
          gifts.purchase_status AS gift_status
        FROM gift_orders
        INNER JOIN gifts ON gifts.id = gift_orders.gift_id
        INNER JOIN gift_groups ON gift_groups.id = gifts.group_id
        WHERE gift_orders.id = ?
        FOR UPDATE
      `,
      [id]
    );
    const row = rows[0];

    if (!row) {
      throw new Error("Ordem de presente nÃ£o encontrada.");
    }

    if (row.status === "reserved" || row.status === "checkout_pending") {
      await connection.execute(
        "UPDATE gift_orders SET status = 'cancelled' WHERE id = ?",
        [id]
      );

      if (row.gift_status === "reserved") {
        await connection.execute(
          `
            UPDATE gifts
            SET purchase_status = 'available',
                reserved_until = NULL
            WHERE id = ?
          `,
          [row.gift_id]
        );
      }
    }

    await connection.commit();
    return getGiftOrderWith(pool, id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function mapPaymentStatusToOrderStatus(
  payment: MercadoPagoPaymentInput
): GiftOrderRecord["status"] {
  if (payment.status === "approved") {
    return "approved";
  }

  if (["rejected", "cancelled", "refunded", "charged_back"].includes(payment.status)) {
    return "rejected";
  }

  return "checkout_pending";
}

export async function applyMercadoPagoPayment(payment: MercadoPagoPaymentInput) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await expireGiftReservationsWith(connection);

    const [rows] = await connection.execute<GiftOrderRow[]>(
      `
        SELECT
          gift_orders.*,
          gifts.name AS gift_name,
          gift_groups.name AS group_name
        FROM gift_orders
        INNER JOIN gifts ON gifts.id = gift_orders.gift_id
        INNER JOIN gift_groups ON gift_groups.id = gifts.group_id
        WHERE gift_orders.external_reference = ?
        FOR UPDATE
      `,
      [payment.externalReference]
    );
    const row = rows[0];

    if (!row) {
      throw new Error("Ordem de presente nÃ£o encontrada.");
    }

    const amountMatches = row.amount_cents === payment.amountCents;
    const currencyMatches = payment.currencyId === "BRL";
    const status = mapPaymentStatusToOrderStatus(payment);
    const canApprove = status === "approved" && amountMatches && currencyMatches;
    const nextStatus = canApprove ? "approved" : status === "approved" ? "rejected" : status;

    await connection.execute(
      `
        UPDATE gift_orders
        SET status = ?,
            mp_payment_id = ?,
            mp_status = ?,
            mp_status_detail = ?,
            approved_at = CASE WHEN ? THEN UTC_TIMESTAMP() ELSE approved_at END
        WHERE id = ?
      `,
      [
        nextStatus,
        payment.id,
        payment.status,
        payment.statusDetail,
        canApprove,
        row.id
      ]
    );

    if (canApprove) {
      await connection.execute(
        `
          UPDATE gifts
          SET purchase_status = 'sold',
              reserved_until = NULL,
              sold_at = UTC_TIMESTAMP()
          WHERE id = ?
        `,
        [row.gift_id]
      );
    } else if (nextStatus === "rejected") {
      await connection.execute(
        `
          UPDATE gifts
          SET purchase_status = 'available',
              reserved_until = NULL
          WHERE id = ?
            AND purchase_status = 'reserved'
        `,
        [row.gift_id]
      );
    }

    await connection.commit();
    return getGiftOrderWith(pool, row.id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
