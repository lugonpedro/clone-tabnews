import orchestrator from "tests/orchestrator.js";
import session from "models/session";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With an inexistent token", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/activations/f5754aa3-8163-4e4b-bbb1-8cc9f5240d2b",
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Activation token not found or expired",
        action: "Register again",
        status_code: 404,
      });
    });

    test("With an expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithAnExpiredToken",
      });
      const expiredToken = await orchestrator.createActivationToken(
        createdUser.id,
      );

      jest.useRealTimers();
      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Activation token not found or expired",
        action: "Register again",
        status_code: 404,
      });
    });

    test("With a valid token", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithAValidToken",
      });
      const validToken = await orchestrator.createActivationToken(
        createdUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${validToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.used_at).not.toBeNull();
    });
  });

  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });
      const validToken = await orchestrator.createActivationToken(
        createdUser.id,
      );

      await orchestrator.activateUser(createdUser);
      const createdSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${validToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${createdSession.token}`,
          },
        },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You don't have permission to execute this action",
        action: `Verify if user have feature read:activation_token`,
        status_code: 403,
      });
    });
  });
});
