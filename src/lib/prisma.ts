import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// During build, environment variables might not be loaded. Use a dummy URL to pass validation.
const url = process.env.DATABASE_URL || "file:./dev.db";

export const prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
        db: {
            url: url,
        },
    },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
