import { getAlerts } from "@/lib/alerts";
import { getSnapshot } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await getSnapshot();
  const data = await getAlerts(snap.prices);
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
