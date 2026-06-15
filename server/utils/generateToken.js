import jwt from "jsonwebtoken";

/**
 * Generate a signed JWT for the given user ID.
 * @param {string} id - MongoDB user _id
 * @returns {string} Signed JWT
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

export default generateToken;
