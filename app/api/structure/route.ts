import { getStructure } from "@/lib/structure";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getStructure();
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
