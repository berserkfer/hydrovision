-- Sprint 3F — DataImport model

CREATE TYPE "DataImportStatus" AS ENUM ('pending', 'validated', 'completed', 'partial', 'failed');

CREATE TABLE "data_imports" (
    "id" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(120),
    "responsable_id" TEXT NOT NULL,
    "responsable_nombre" VARCHAR(150),
    "total_rows" INTEGER NOT NULL,
    "valid_rows" INTEGER NOT NULL DEFAULT 0,
    "warning_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "imported_rows" INTEGER NOT NULL DEFAULT 0,
    "rejected_rows" INTEGER NOT NULL DEFAULT 0,
    "status" "DataImportStatus" NOT NULL DEFAULT 'pending',
    "column_mapping" JSONB,
    "error_log" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_imports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "data_imports_status_idx" ON "data_imports"("status");
CREATE INDEX "data_imports_started_at_idx" ON "data_imports"("started_at");
CREATE INDEX "data_imports_responsable_id_idx" ON "data_imports"("responsable_id");

ALTER TABLE "data_imports" ADD CONSTRAINT "data_imports_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
