import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
    // During next build, DATABASE_URL may not be set. Prisma client
    // creation is deferred to first use via the Proxy below.
    if (!process.env.DATABASE_URL) {
        // Return a Proxy that lazily creates the real client on first access
        let client: PrismaClient | null = null;
        return new Proxy({} as PrismaClient, {
            get(_target, prop) {
                if (!client) {
                    client = new PrismaClient({
                        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
                    });
                }
                return (client as unknown as Record<string | symbol, unknown>)[prop];
            },
        });
    }

    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
