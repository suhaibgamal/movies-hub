// app/api/watchlist/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// Singleton Prisma client (avoids connection exhaustion in dev)
let prisma;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) global.prisma = new PrismaClient();
  prisma = global.prisma;
}

const ItemTypeEnum = z.enum(["MOVIE", "TV"]);

// Unified schema — POST and DELETE both only need itemId + itemType
const watchListItemSchema = z.object({
  itemId: z.number().int().positive(),
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
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = watchListItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { itemId, itemType } = parsed.data;

    // Upsert-style: only create if not already present
    const existingItem = await prisma.watchlistItem.findFirst({
      where: { userId, itemId, itemType },
    });

    if (existingItem) {
      return NextResponse.json(
        { message: "Item already in watchlist" },
        { status: 200 }
      );
    }

    await prisma.watchlistItem.create({
      data: {
        user: { connect: { id: userId } },
        itemId,
        itemType,
      },
    });

    return NextResponse.json(
      { message: "Item added to watchlist" },
      { status: 201 }
    );
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
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = watchListItemSchema.safeParse(body);
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

    // Single-item check: returns { watchlisted: bool }
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
        where: { userId, itemId, itemType: validatedItemType.data },
      });
      return NextResponse.json({ watchlisted: !!item });
    }

    // Full list: return only IDs (no metadata, no userId, no createdAt)
    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId },
      select: { itemId: true, itemType: true },
      orderBy: { createdAt: "desc" },
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
