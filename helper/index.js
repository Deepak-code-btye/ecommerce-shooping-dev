import crypto from "crypto";

const salt = crypto.randomBytes(16);
export const hashPassword = async (password) => {
  const hsd = crypto.pbkdf2(
    password,
    salt,
    310000,
    32,
    "sha256",

    await function (err, hashedPassword) {}
  );
  return hsd;
};
