import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getWatchlist(userId) {
  return prisma.watchlistItem.findMany({
    where: { userId },
    select: { movieId: true, movieData: true },
  });
}
