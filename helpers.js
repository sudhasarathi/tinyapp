const getUserByEmail = (email, database) => {
  return Object.values(database).find(user => user.email === email);
};
function generateRandomString() {
  return Math.random().toString(36).substring(6);
}
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

module.exports = { getUserByEmail };