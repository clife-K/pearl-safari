const dotenv = require("dotenv");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient, CurrencyCode } = require("@prisma/client");

dotenv.config();

const { resolveDatabaseUrl } = require("../resolve-database-url.cjs");
const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
    console.error("DATABASE_URL is missing — set it or reference Postgres vars in Railway.");
    process.exit(1);
}
process.env.DATABASE_URL = databaseUrl;

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const destinations = [
  {
    name: "Bwindi Impenetrable National Park",
    slug: "bwindi-impenetrable-national-park",
    region: "Western Uganda",
    description:
      "Ancient rainforest and the world-renowned mountain gorilla trekking experience.",
  },
  {
    name: "Murchison Falls National Park",
    slug: "murchison-falls-national-park",
    region: "Northern Uganda",
    description:
      "Boat cruise to the base of the falls and classic game drives across vast savannah.",
  },
  {
    name: "Jinja - Source of the Nile",
    slug: "jinja-source-of-the-nile",
    region: "Eastern Uganda",
    description:
      "Adventure capital of East Africa with rafting, kayaking, and bungee experiences.",
  },
  {
    name: "Queen Elizabeth National Park",
    slug: "queen-elizabeth-national-park",
    region: "Western Uganda",
    description:
      "Tree-climbing lions, crater lakes, and the famous Kazinga Channel boat safari.",
  },
  {
    name: "Lake Bunyonyi",
    slug: "lake-bunyonyi",
    region: "South-West Uganda",
    description:
      "A scenic retreat of islands and highlands, ideal for canoeing and relaxation.",
  },
  {
    name: "Kidepo Valley National Park",
    slug: "kidepo-valley-national-park",
    region: "Northern Uganda",
    description:
      "Remote and dramatic wilderness with unique wildlife and rich Karamojong culture.",
  },
];

async function upsertDestination(destination) {
  return prisma.destination.upsert({
    where: { slug: destination.slug },
    update: {
      name: destination.name,
      region: destination.region,
      description: destination.description,
      isActive: true,
    },
    create: {
      ...destination,
      isActive: true,
    },
  });
}

async function run() {
  const destinationMap = {};

  for (const destination of destinations) {
    const created = await upsertDestination(destination);
    destinationMap[destination.slug] = created.id;
  }

  const packages = [
    {
      title: "Gorilla Expedition - Bwindi",
      slug: "gorilla-expedition-bwindi",
      destinationSlug: "bwindi-impenetrable-national-park",
      durationDays: 3,
      basePrice: 850,
      description: "Mountain gorilla trek with permits, transport, and lodge stay included.",
    },
    {
      title: "Murchison Falls Safari",
      slug: "murchison-falls-safari",
      destinationSlug: "murchison-falls-national-park",
      durationDays: 4,
      basePrice: 620,
      description: "Game drives and Nile cruise showcasing Uganda's iconic wildlife corridor.",
    },
    {
      title: "Jinja Adventure Weekend",
      slug: "jinja-adventure-weekend",
      destinationSlug: "jinja-source-of-the-nile",
      durationDays: 2,
      basePrice: 280,
      description: "High-energy rafting and Nile source experiences for thrill seekers.",
    },
    {
      title: "Gorillas and Lakes Explorer",
      slug: "gorillas-and-lakes-explorer",
      destinationSlug: "lake-bunyonyi",
      durationDays: 5,
      basePrice: 1100,
      description: "Bwindi gorillas plus relaxation and island hopping on Lake Bunyonyi.",
    },
    {
      title: "Western Uganda Grand Safari",
      slug: "western-uganda-grand-safari",
      destinationSlug: "queen-elizabeth-national-park",
      durationDays: 6,
      basePrice: 1550,
      description: "Comprehensive western circuit with primates, big game, and boat cruises.",
    },
    {
      title: "Kidepo Valley Wilderness",
      slug: "kidepo-valley-wilderness",
      destinationSlug: "kidepo-valley-national-park",
      durationDays: 7,
      basePrice: 1350,
      description: "Exclusive off-grid safari through Uganda's most remote national park.",
    },
  ];

  for (const pkg of packages) {
    const destinationId = destinationMap[pkg.destinationSlug] || null;
    await prisma.tourPackage.upsert({
      where: { slug: pkg.slug },
      update: {
        title: pkg.title,
        description: pkg.description,
        durationDays: pkg.durationDays,
        basePrice: pkg.basePrice,
        currency: CurrencyCode.USD,
        isPublished: true,
        destinationId,
      },
      create: {
        title: pkg.title,
        slug: pkg.slug,
        description: pkg.description,
        durationDays: pkg.durationDays,
        basePrice: pkg.basePrice,
        currency: CurrencyCode.USD,
        isPublished: true,
        destinationId,
      },
    });
  }

  console.log("Seed completed successfully.");
}

run()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
