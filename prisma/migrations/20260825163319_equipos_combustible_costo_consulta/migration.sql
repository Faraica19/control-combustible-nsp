/*
  Warnings:

  - Added the required column `tipoCombustible` to the `Equipo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MovimientoInventario" ADD COLUMN "costo" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Equipo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tipoMedidor" TEXT NOT NULL,
    "tipoCombustible" TEXT NOT NULL,
    "lecturaActual" REAL NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "areaId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Equipo_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Equipo" ("activo", "areaId", "codigo", "creadoEn", "id", "lecturaActual", "nombre", "tipo", "tipoMedidor") SELECT "activo", "areaId", "codigo", "creadoEn", "id", "lecturaActual", "nombre", "tipo", "tipoMedidor" FROM "Equipo";
DROP TABLE "Equipo";
ALTER TABLE "new_Equipo" RENAME TO "Equipo";
CREATE UNIQUE INDEX "Equipo_codigo_key" ON "Equipo"("codigo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
