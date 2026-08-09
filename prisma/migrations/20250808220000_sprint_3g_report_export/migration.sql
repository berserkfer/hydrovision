-- Sprint 3G — ReportExport history

CREATE TYPE "ReportExportFormat" AS ENUM ('csv', 'xlsx', 'pdf');

CREATE TABLE "report_exports" (
    "id" TEXT NOT NULL,
    "file_format" "ReportExportFormat" NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "responsable_id" TEXT NOT NULL,
    "responsable_nombre" VARCHAR(150),
    "filters" JSONB NOT NULL,
    "sections" JSONB,
    "record_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "report_exports_created_at_idx" ON "report_exports"("created_at");
CREATE INDEX "report_exports_responsable_id_idx" ON "report_exports"("responsable_id");

ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
