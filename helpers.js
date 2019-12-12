const getUserByEmail = function(email, userDatabase) {
  for (const key in userDatabase) {
    if (userDatabase[key].email === email) {
      return userDatabase[key];
    }
  }
  return undefined;
}

module.exports = { getUserByEmail };