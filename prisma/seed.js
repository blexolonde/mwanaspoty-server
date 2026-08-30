const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  await prisma.jersey.createMany({
    data: [
      { team: "Barcelona", price: 6500, league: "La Liga" },
      { team: "Real Madrid", price: 6500, league: "La Liga" },
      { team: "Manchester United", price: 6000, league: "Premier League" },
      { team: "AC Milan", price: 5800, league: "Serie A" },
      { team: "Arsenal", price: 6000, league: "Premier League" },
      { team: "Juventus", price: 5800, league: "Serie A" },
    ],
  });
  console.log("Seeded jerseys!");
}
main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
