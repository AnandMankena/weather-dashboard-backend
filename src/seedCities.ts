import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCities() {
  const defaultCities = [
    { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060, isDefault: true },
    { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278, isDefault: true },
    { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503, isDefault: true },
    { name: 'Mumbai', country: 'IN', lat: 19.0760, lon: 72.8777, isDefault: true },
  ];

  for (const city of defaultCities) {
    await prisma.city.upsert({
      where: {
        name_country: {
          name: city.name,
          country: city.country
        }
      },
      update: {},
      create: city
    });
  }

  console.log('✅ Default cities seeded!');
}

seedCities()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
