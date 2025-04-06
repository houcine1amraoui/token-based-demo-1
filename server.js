import express from "express";
import cookieParser from "cookie-parser";
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

  res.cookie("token", token, {
    httpOnly: true,
    secure: true, // Only over HTTPS
    sameSite: "Strict", // or 'Lax'
  });

  res.send("You have successfully logged in");
});

// token-based authentication
function isAuthenticated(req, res, next) {
  const cookies = req.cookies;
  if (!cookies) {
    return res.status(401).send("Unauthenticated");
  }
  const token = cookies.token;
  if (!token) {
    return res.send("Invalid Token");
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.json(error.message);
  }
}

// Logout: Option1: clear cookies
// if token is kept, user can easly authenticate before token expiry
// alternative solution: blacklist token until its expiry
app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });
  res.status(200).send({ message: "Logged out successfully" });
});

const PORT = 1000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
