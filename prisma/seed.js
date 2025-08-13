const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 데이터베이스 초기화 완료!')
  } catch (error) {
    console.error('❌ 시드 데이터 삽입 중 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()