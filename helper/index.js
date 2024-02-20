import crypto from "crypto";

// Define a function to hash the password using bcrypt
const salt = crypto.randomBytes(16);
export const hashPassword = async (password) => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      310000,
      32,
      "sha256",
      (err, hashedPassword) => {
        if (err) {
          reject(err);
        } else {
          resolve(hashedPassword);
        }
      }
    );
  });
};
