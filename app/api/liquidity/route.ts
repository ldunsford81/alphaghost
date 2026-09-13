import { getLiquidity } from "@/lib/liquidity";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getLiquidity();
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
