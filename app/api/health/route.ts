import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Health endpoint for the Docker healthcheck. Verifies DB connectivity.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch (error) {
    console.error("health check failed", error);
    return NextResponse.json(
      { status: "degraded", db: "down" },
      { status: 503 },
    );
  }
}
