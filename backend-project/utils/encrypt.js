const bcrypt = require('bcrypt');

// encryptPassword — hashes a plain-text password using bcrypt with a salt round of 10
const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// comparePassword — compares a plain-text password against a stored bcrypt hash
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = { encryptPassword, comparePassword };
