import activation from "models/activation";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.clearEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody;

  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@email.com",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@email.com",
      features: ["read:activation_token"],
      password: createUserResponseBody.password,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    const activationToken = await activation.findOneByUserId(
      createUserResponseBody.id,
    );

    expect(lastEmail.sender).toBe("<contato@tabnews.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@email.com>");
    expect(lastEmail.subject).toBe("Activate your registration in TabNews");
    expect(lastEmail.text).toContain("RegistrationFlow");
    expect(lastEmail.text).toContain(activationToken.id);
  });

  test("Activate account", async () => {});

  test("Login", async () => {});

  test("Get user information", async () => {});
});
