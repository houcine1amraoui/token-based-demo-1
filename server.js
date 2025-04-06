import express from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

import { seedUsers, loadUsers } from "./users_db.js";
import { seedPosts, loadPosts, addPost } from "./posts_db.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

seedUsers();
seedPosts();

// get post of a specific user
// user should authenticate
// then authorization is performed based on username
app.get("/posts", isAuthenticated, async (req, res) => {
  const username = req.username;
  const posts = loadPosts();
  res.json(posts.filter((post) => post.author === username));
});

// create a post by a specific user
// user should authenticate
app.post("/posts", isAuthenticated, async (req, res) => {
  const username = req.username;
  const { title } = req.body;
  if (!username || !title) {
    return res.send("Both username and title are required");
  }

  addPost(title, username);
  res.send("Post created successfully");
});

// also called signin
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Check username and password value existence
  if (!username || !password) {
    return res.send("Both username and password are required");
  }

  // Check user existence
  const users = loadUsers();
  const user = users.find((user) => user.username === username);
  if (!user) {
    return res.send("Invalid username or password");
  }

  // Check password matching
  if (user.password !== password) {
    return res.send("Invalid username or password");
  }

  // create and sign a jwt token
  const payload = { username };
  const token = jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return res.json({ token });
});

// token-based authentication
function isAuthenticated(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.send("Invalid Authorization Header");
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.send("Invalid Authorization Header");
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    console.log(decoded.username);
    // return res.send(decoded);
    next();
    // return res.json(decoded);
  } catch (error) {
    return res.json(error.message);
  }
}

const PORT = 2000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
