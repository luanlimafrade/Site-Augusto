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

CREATE TABLE IF NOT EXISTS gift_groups (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(280) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gift_groups_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
