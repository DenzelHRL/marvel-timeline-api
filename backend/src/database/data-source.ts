import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";
import { ENTITIES } from "./entities";
import { InitialSchema20260929000000 } from "./migrations/20260929000000-InitialSchema";
import { AddComments20260929180000 } from "./migrations/20260929180000-AddComments";

import { ChronologicalTrails20261014060000 } from "./migrations/20261014060000-ChronologicalTrails";

loadEnv();

export function databaseOptions(): DataSourceOptions {
  const shared = {
    type: "postgres" as const,
    entities: ENTITIES,
    migrations: [
      InitialSchema20260929000000,
      AddComments20260929180000,
      ChronologicalTrails20261014060000,
    ],
    synchronize: false,
    migrationsRun: false,
  };

  if (process.env.DATABASE_URL) {
    return { ...shared, url: process.env.DATABASE_URL };
  }

  if (process.env.NODE_ENV === "production" && !process.env.DB_PASSWORD) {
    throw new Error("Configure DB_PASSWORD ou DATABASE_URL em produção.");
  }

  return {
    ...shared,
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? "marvel",
    password: process.env.DB_PASSWORD ?? "marvel_dev_only",
    database: process.env.DB_NAME ?? "marvel_timeline",
  };
}

export const AppDataSource = new DataSource(databaseOptions());
