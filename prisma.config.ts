// Prisma 7 moved the migration connection URL out of schema.prisma into this
// config file. We intentionally avoid importing from "prisma/config" or "dotenv"
// so the config loads even from the slim standalone runner (where only the global
// Prisma CLI is present). DATABASE_URL comes from the environment (Docker Compose
// injects it; locally Prisma auto-loads .env). The runtime client uses the pg
// driver adapter — see lib/db/prisma.ts.
const config = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
};

export default config;
