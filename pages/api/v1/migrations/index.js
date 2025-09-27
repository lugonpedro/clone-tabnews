import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import controller from "infra/controller";
const router = createRouter();

router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  let dbClient = await database.getNewClient();

  const pendingMigrations = await migrationRunner({
    dbClient: dbClient,
    dryRun: true,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  });
  await dbClient.end();
  return res.status(200).json(pendingMigrations);
}

async function postHandler(req, res) {
  let dbClient = await database.getNewClient();

  const migratedMigrations = await migrationRunner({
    dbClient: dbClient,
    dryRun: false,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  });
  await dbClient.end();

  if (migratedMigrations.length > 0) {
    return res.status(201).json(migratedMigrations);
  }

  return res.status(200).json(migratedMigrations);
}
