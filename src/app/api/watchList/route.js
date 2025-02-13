// app/api/watchList/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// Use a singleton pattern for Prisma in development
let prisma;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) global.prisma = new PrismaClient();
  prisma = global.prisma;
}

// Schemas for validation
const watchListPostSchema = z.object({
  movieId: z.number(),
  movieData: z.object({}).passthrough(),
});

const watchListDeleteSchema = z.object({
  movieId: z.number(),
});

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = watchListPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { movieId, movieData } = parsed.data;
    const existingItem = await prisma.watchlistItem.findFirst({
      where: { userId, movieId },
    });
    if (existingItem) {
      return NextResponse.json(
        { message: "Movie already in watchlist" },
        { status: 200 }
      );
    } else {
      const newItem = await prisma.watchlistItem.create({
        data: {
          user: { connect: { id: userId } },
          movieId,
          movieData,
        },
      });
      return NextResponse.json(
        { message: "Movie added to watchlist", item: newItem },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("POST /api/watchList Error:", error?.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = watchListDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { movieId } = parsed.data;
    const deletedItem = await prisma.watchlistItem.deleteMany({
      where: { userId, movieId },
    });
    if (deletedItem.count > 0) {
      return NextResponse.json(
        { message: "Movie removed from watchlist" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Movie not found in watchlist" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("DELETE /api/watchList Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get("movieId");

    if (movieId) {
      const item = await prisma.watchlistItem.findFirst({
        where: { userId, movieId: Number(movieId) },
      });
      return NextResponse.json({ watchlisted: !!item });
    }

    // Return full watchlist if no movieId is provided.
    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId },
    });
    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error("GET /api/watchList Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
