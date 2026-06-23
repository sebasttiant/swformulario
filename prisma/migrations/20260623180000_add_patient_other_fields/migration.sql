-- AlterTable: free-text fields for the "Otro" option in city and nationality.
ALTER TABLE "Patient" ADD COLUMN "cityOther" TEXT;
ALTER TABLE "Patient" ADD COLUMN "nationalityOther" TEXT;
