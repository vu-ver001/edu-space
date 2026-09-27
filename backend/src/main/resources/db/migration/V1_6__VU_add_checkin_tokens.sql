-- M09: one-time QR/text credentials for check-in verification.
-- Hibernate ddl-auto=update creates this table in the default dev setup;
-- this migration is provided for environments that apply SQL migrations.
CREATE TABLE IF NOT EXISTS checkin_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    issued_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    status VARCHAR(16) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_checkin_token_hash (token_hash),
    KEY idx_checkin_token_booking_status (booking_id, status)
);
