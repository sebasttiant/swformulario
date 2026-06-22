-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT NOT NULL,
    "secondName" TEXT,
    "firstSurname" TEXT NOT NULL,
    "secondSurname" TEXT,
    "sexCatalogValueId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT,
    "cityCatalogValueId" TEXT,
    "fixedPhone" TEXT,
    "mobilePhone" TEXT,
    "email" TEXT,
    "noEmail" BOOLEAN NOT NULL DEFAULT false,
    "residentialZoneCatalogValueId" TEXT,
    "userTypeCatalogValueId" TEXT,
    "nationalityCatalogValueId" TEXT,
    "insurerCatalogValueId" TEXT,
    "patientOriginCatalogValueId" TEXT,
    "treatmentCatalogValueId" TEXT,
    "documentExpeditionCityCatalogValueId" TEXT,
    "entityCatalogValueId" TEXT,
    "planCatalogValueId" TEXT,
    "habeasDataAccepted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Catalog" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogValue" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "atheneaValue" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CatalogValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DimensionMapping" (
    "id" TEXT NOT NULL,
    "dimensionKey" TEXT NOT NULL,
    "sourceField" TEXT NOT NULL,
    "catalogKey" TEXT,
    "exportKey" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DimensionMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportBatch" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "manifestFilename" TEXT NOT NULL,
    "patientCount" INTEGER NOT NULL,
    "mappingVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Patient_documentNumber_idx" ON "Patient"("documentNumber");

-- CreateIndex
CREATE INDEX "Patient_firstSurname_firstName_idx" ON "Patient"("firstSurname", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Catalog_key_key" ON "Catalog"("key");

-- CreateIndex
CREATE INDEX "CatalogValue_catalogId_idx" ON "CatalogValue"("catalogId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogValue_catalogId_code_key" ON "CatalogValue"("catalogId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DimensionMapping_dimensionKey_key" ON "DimensionMapping"("dimensionKey");

-- AddForeignKey
ALTER TABLE "CatalogValue" ADD CONSTRAINT "CatalogValue_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
