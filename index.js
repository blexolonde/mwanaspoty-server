const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("MwanaSpoty API is running");
});

app.get("/api/jerseys", async (req, res) => {
  const jerseys = await prisma.jersey.findMany();
  res.json(jerseys);
});

app.get("/api/jerseys/:id", async (req, res) => {
  const jersey = await prisma.jersey.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!jersey) return res.status(404).json({ error: "Jersey not found" });
  res.json(jersey);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
