import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const cafes = await prisma.cafe.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return Response.json({ cafes })
  } catch (error) {
    console.error('Database error:', error)
    return Response.json(
      { error: 'Failed to fetch cafes' },
      { status: 500 }
    )
  }
}