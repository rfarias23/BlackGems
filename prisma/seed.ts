import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const user = await prisma.user.upsert({
        where: { email: 'admin@blackgem.com' },
        update: {},
        create: {
            email: 'admin@blackgem.com',
            name: 'Admin User',
            passwordHash: hashedPassword,
            role: UserRole.FUND_ADMIN,
        },
    })
    console.log({ user })
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
