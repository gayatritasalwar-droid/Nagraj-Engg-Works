// Dummy users (for now)
const users = [
  { username: "admin", password: "123", role: "admin" },
  { username: "ceo", password: "123", role: "ceo" },
  { username: "contractor", password: "123", role: "contractor" },
  { username: "production", password: "123", role: "production_head" }
];

// Login
const loginUser = (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (user) {
    res.json({ message: "Login successful", role: user.role });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

module.exports = { loginUser };