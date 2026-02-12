import orchestrator from "tests/orchestrator.js";
import session from "models/session";
import user from "models/user";
import { version as uuidVersion } from "uuid";
import activation from "models/activation";

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

    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await orchestrator.createActivationToken(
        createdUser.id,
      );

      const response1 = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response1.status).toBe(200);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response2.status).toBe(404);
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
      expect(responseBody).toEqual({
        id: validToken.id,
        used_at: responseBody.used_at,
        user_id: validToken.user_id,
        expires_at: validToken.expires_at.toISOString(),
        created_at: validToken.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);

      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(activation.EXPIRATION_IN_MILLISECONDS);

      const activatedUser = await user.findOneById(responseBody.user_id);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
      ]);
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
