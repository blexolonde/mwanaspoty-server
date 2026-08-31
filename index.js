const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./authMiddleware");
const adminMiddleware = require("./adminMiddleware");
const multer = require("multer");
const cloudinary = require("./cloudinary");

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("MwanaSpoty API is running");
});

app.get("/api/jerseys", async (req, res) => {
  const { league, search, classic } = req.query;
  const jerseys = await prisma.jersey.findMany({
    where: {
      league: league ? league : undefined,
      team: search ? { contains: search, mode: "insensitive" } : undefined,
      isClassic: classic === "true" ? true : undefined,
    },
  });
  res.json(jerseys);
});

app.get("/api/best-sellers", async (req, res) => {
  const items = await prisma.orderItem.groupBy({
    by: ["jerseyId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 8,
  });
  const jerseyIds = items.map((i) => i.jerseyId).filter(Boolean);
  const jerseys = await prisma.jersey.findMany({
    where: { id: { in: jerseyIds } },
  });
  const result = items
    .map((i) => jerseys.find((j) => j.id === i.jerseyId))
    .filter(Boolean);
  res.json(result);
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
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

app.post("/api/orders", authMiddleware, async (req, res) => {
  const { items } = req.body;
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const order = await prisma.order.create({
    data: {
      userId: req.userId,
      total,
      items: {
        create: items.map((item) => ({
          jerseyId: item.id,
          team: item.team,
          price: item.price,
          quantity: item.quantity || 1,
        })),
      },
    },
    include: { items: true },
  });
  res.json(order);
});

app.get("/api/orders", authMiddleware, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

app.get("/api/orders/:id", authMiddleware, async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
    include: { items: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

app.post("/api/jerseys", authMiddleware, adminMiddleware, async (req, res) => {
  const { team, price, league, isClassic, image } = req.body;
  const jersey = await prisma.jersey.create({
    data: { team, price, league, isClassic: isClassic || false, image },
  });
  res.json(jersey);
});

app.put(
  "/api/jerseys/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { team, price, league } = req.body;
    const jersey = await prisma.jersey.update({
      where: { id: Number(req.params.id) },
      data: { team, price, league },
    });
    res.json(jersey);
  },
);

app.delete(
  "/api/jerseys/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    await prisma.jersey.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  },
);

app.post(
  "/api/upload",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "mwanaspoty" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });
      res.json({ url: result.secure_url });
    } catch (err) {
      res.status(500).json({ error: "Upload failed" });
    }
  },
);

app.get(
  "/api/admin/orders",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  },
);

app.patch(
  "/api/admin/orders/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status },
    });
    res.json(order);
  },
);

app.get(
  "/api/admin/customers",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    res.json(users);
  },
);

app.get(
  "/api/admin/analytics/best-sellers",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const items = await prisma.orderItem.groupBy({
      by: ["team"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });
    res.json(items.map((i) => ({ team: i.team, sold: i._sum.quantity })));
  },
);

app.get(
  "/api/admin/analytics/best-leagues",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const items = await prisma.orderItem.findMany({
      include: { jersey: true },
    });
    const leagueTotals = {};
    items.forEach((item) => {
      if (!item.jersey) return;
      const league = item.jersey.league;
      leagueTotals[league] = (leagueTotals[league] || 0) + item.quantity;
    });
    const result = Object.entries(leagueTotals)
      .map(([league, sold]) => ({ league, sold }))
      .sort((a, b) => b.sold - a.sold);
    res.json(result);
  },
);

app.get(
  "/api/admin/analytics/low-stock",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const jerseys = await prisma.jersey.findMany({
      where: { stock: { lt: 5 } },
      orderBy: { stock: "asc" },
    });
    res.json(jerseys);
  },
);

app.get(
  "/api/admin/analytics/segments",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const orders = await prisma.order.findMany({
      select: { userId: true, total: true },
    });
    const spendByUser = {};
    orders.forEach((o) => {
      spendByUser[o.userId] = (spendByUser[o.userId] || 0) + o.total;
    });
    let high = 0,
      medium = 0,
      low = 0;
    Object.values(spendByUser).forEach((spend) => {
      if (spend >= 15000) high++;
      else if (spend >= 6000) medium++;
      else low++;
    });
    res.json({ high, medium, low });
  },
);

app.get(
  "/api/admin/analytics/sales-trend",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { total: true, createdAt: true },
    });
    const dailyTotals = {};
    orders.forEach((o) => {
      const day = o.createdAt.toISOString().split("T")[0];
      dailyTotals[day] = (dailyTotals[day] || 0) + o.total;
    });
    const result = Object.entries(dailyTotals)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
    res.json(result);
  },
);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});