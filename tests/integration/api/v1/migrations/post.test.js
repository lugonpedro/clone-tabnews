import database from "infra/database.js";

async function cleanDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
}

beforeAll(cleanDatabase)

test("POST to /api/v1/migrations must return 200", async () => {
  const response1 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response1.status).toBe(201);

  const response1Body = await response1.json();

  expect(Array.isArray(response1Body)).toBe(true);
  expect(response1Body.length).toBeGreaterThan(0);
  response1Body.forEach((migration) => {
    expect(migration).toEqual(
      expect.objectContaining({
        path: expect.any(String),
        name: expect.any(String),
        timestamp: expect.any(Number),
      }),
    );
  });

  const response2 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response2.status).toBe(200);

  const response2Body = await response2.json();

  expect(Array.isArray(response2Body)).toBe(true);
  expect(response2Body.length).toBe(0);
});
