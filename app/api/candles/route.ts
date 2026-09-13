import { getBtcCandles } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getBtcCandles();
  return Response.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
