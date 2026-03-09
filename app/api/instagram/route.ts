import { NextResponse } from "next/server";
import { getInstagramMedia } from "@/lib/instagram";

export const revalidate = 3600;

export async function GET() {
  try {
    const media = await getInstagramMedia();
    return NextResponse.json({ data: media });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch Instagram media" },
      { status: 500 }
    );
  }
}
