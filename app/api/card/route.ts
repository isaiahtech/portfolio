import { NextRequest, NextResponse } from "next/server";

const VALID_CARD = "1234567890123456789";

export async function POST(req: NextRequest) {
  const { cardNumber } = await req.json();

  if (typeof cardNumber !== "string" || !/^\d{19}$/.test(cardNumber)) {
    return NextResponse.json({ isValid: false }, { status: 200 });
  }

  return NextResponse.json({ isValid: cardNumber === VALID_CARD }, { status: 200 });
}
