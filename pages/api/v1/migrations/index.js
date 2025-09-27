import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const router = createRouter();

router.get(getHandler).post(postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(err, req, res) {
  const publicErrorObject = new InternalServerError({
    cause: err,
  });

  res.status(500).json(publicErrorObject);
}

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
