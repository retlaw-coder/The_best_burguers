import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)

  // User Password (PIN)
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, password: '1234' },
  })

  // Initial Prices from the mockup
  const prices = {
    'cheese-s': 7400, 'cheese-d': 9900, 'cheese-t': 11900,
    'cb-s': 7700, 'cb-d': 10200, 'cb-t': 12200,
    'tasty-s': 8000, 'tasty-d': 10500, 'tasty-t': 12500,
    'yankee-s': 8000, 'yankee-d': 10500, 'yankee-t': 12500,
    'mega-s': 8000, 'mega-d': 10500, 'mega-t': 12500,
    'coca-15': 3800, 'coca-05': 2200,
    'sprite-15': 3800, 'sprite-05': 2200,
    'fanta-15': 3800, 'fanta-05': 2200,
    'ex-medallion': 2500, 'ex-bacon': 1000, 'ex-cheddar': 800, 
    'ex-tomato': 500, 'ex-lettuce': 500, 'ex-papas': 500, 
    'ex-ketchup': 500, 'ex-tasty': 500, 'ex-onion': 500
  }

  for (const [id, price] of Object.entries(prices)) {
    await prisma.productPrice.upsert({
      where: { id },
      update: { price },
      create: { id, price },
    })
  }

  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
