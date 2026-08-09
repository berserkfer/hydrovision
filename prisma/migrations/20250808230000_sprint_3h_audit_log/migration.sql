-- Sprint 3H — AuditLog

CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete', 'import', 'export');

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(80) NOT NULL,
    "action" "AuditAction" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previous_data" JSONB,
    "new_data" JSONB,
    "description" TEXT,
    "responsable_id" TEXT NOT NULL,
    "responsable_nombre" VARCHAR(150),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
CREATE INDEX "audit_logs_responsable_id_idx" ON "audit_logs"("responsable_id");

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
