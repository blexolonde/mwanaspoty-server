const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function adminMiddleware(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
module.exports = adminMiddleware;
