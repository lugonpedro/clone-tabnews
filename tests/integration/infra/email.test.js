import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.clearEmails();

    await email.send({
      from: "John <johndoe@email.com.br>",
      to: "doejohn@email.com.br",
      subject: "Subject test",
      text: "Body test",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<johndoe@email.com.br>");
    expect(lastEmail.recipients[0]).toBe("<doejohn@email.com.br>");
    expect(lastEmail.subject).toBe("Subject test");
    expect(lastEmail.text).toBe("Body test\n");
  });
});
