import user from "models/user";
import password from "models/password";
import { NotFoundError, UnauthorizedError } from "infra/errors.js";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Auth data don't match",
        action: "Verify data",
      });
    }

    throw err;
  }

  async function findUserByEmail(providedEmail) {
    let storedUser;

    try {
      storedUser = await user.findOneByEmail(providedEmail);
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email don't match",
          action: "Verify email",
        });
      }

      throw err;
    }

    return storedUser;
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Password don't match",
        action: "Verify password",
      });
    }
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
