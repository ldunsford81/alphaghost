import { getSnapshot } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getSnapshot();
  return Response.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
