// app/api/watchlist/route.js
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

const ItemTypeEnum = z.enum(["MOVIE", "TV"]);

// Schemas for validation
const watchListPostSchema = z.object({
  itemId: z.number(),
  itemType: ItemTypeEnum,
  itemData: z.object({}).passthrough(), // General object for movie or TV data
});

const watchListDeleteSchema = z.object({
  itemId: z.number(),
  itemType: ItemTypeEnum,
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
    const { itemId, itemType, itemData } = parsed.data;
    const existingItem = await prisma.watchlistItem.findFirst({
      where: { userId, itemId, itemType },
    });
    if (existingItem) {
      return NextResponse.json(
        { message: "Item already in watchlist" },
        { status: 200 }
      );
    } else {
      const newItem = await prisma.watchlistItem.create({
        data: {
          user: { connect: { id: userId } },
          itemId,
          itemType,
          itemData,
        },
      });
      return NextResponse.json(
        { message: "Item added to watchlist", item: newItem },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("POST /api/watchlist Error:", error?.message || error);
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
    const { itemId, itemType } = parsed.data;
    const deletedItem = await prisma.watchlistItem.deleteMany({
      where: { userId, itemId, itemType },
    });
    if (deletedItem.count > 0) {
      return NextResponse.json(
        { message: "Item removed from watchlist" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Item not found in watchlist" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("DELETE /api/watchlist Error:", error);
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
    const itemIdParam = searchParams.get("itemId");
    const itemTypeParam = searchParams.get("itemType");

    if (itemIdParam && itemTypeParam) {
      const validatedItemType = ItemTypeEnum.safeParse(itemTypeParam);
      if (!validatedItemType.success) {
        return NextResponse.json(
          { error: "Invalid itemType" },
          { status: 400 }
        );
      }
      const itemId = Number(itemIdParam);
      if (isNaN(itemId)) {
        return NextResponse.json({ error: "Invalid itemId" }, { status: 400 });
      }

      const item = await prisma.watchlistItem.findFirst({
        where: { userId, itemId: itemId, itemType: validatedItemType.data },
      });
      return NextResponse.json({ watchlisted: !!item });
    }

    // Return full watchlist if no itemId is provided.
    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }, // Optional: order by creation date
    });
    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error("GET /api/watchlist Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
