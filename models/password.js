import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRounds();
  const passwordPepper = addPepperPassword(password);
  return await bcryptjs.hash(passwordPepper, rounds);
}

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

function addPepperPassword(password) {
  const pepper = process.env.HASH_PEPPER || "";

  const result = password.concat(pepper);

  return result;
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(providedPassword, storedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
