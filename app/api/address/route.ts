import { NextResponse } from "next/server";

const API_KEY = process.env.FINDADDRESS_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postcode = searchParams.get("postcode");

  if (!postcode) {
    return NextResponse.json({ error: "Missing postcode" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.findaddress.io/find/${postcode}?api-key=${API_KEY}&house=7`
    );

    console.log('i am here' + postcode);

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}