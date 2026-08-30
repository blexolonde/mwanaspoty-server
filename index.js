const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("MwanaSpoty API is running");
});

app.get("/api/jerseys", async (req, res) => {
  const { league, search } = req.query;
  const jerseys = await prisma.jersey.findMany({
    where: {
      league: league ? league : undefined,
      team: search ? { contains: search, mode: "insensitive" } : undefined,
    },
  });
  res.json(jerseys);
});

app.get("/api/leagues", async (req, res) => {
  const jerseys = await prisma.jersey.findMany({
    select: { league: true },
    distinct: ["league"],
  });
  res.json(jerseys.map((j) => j.league));
});

app.get("/api/jerseys/:id", async (req, res) => {
  const jersey = await prisma.jersey.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!jersey) return res.status(404).json({ error: "Jersey not found" });
  res.json(jersey);
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  res.json({ id: user.id, name: user.name, email: user.email });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
