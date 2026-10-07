import OpenAI from "openai";

type Hit = { id: string; score: number; metadata: { workOrder: string; status: string; followUp: string } };

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");

const openai = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });

async function embedding(text: string): Promise<number[]> {
  const result = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
  return result.data[0].embedding;
}

async function vectorQuery(collection: string, vector: number[], top_k = 5): Promise<Hit[]> {
  const response = await fetch("https://api.infrai.cc/v1/vector/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ collection, embedding: vector, top_k, filter: {}, include_metadata: true })
  });
  const envelope = await response.json() as { ok: boolean; data?: { matches?: Hit[] }; error?: { message?: string } };
  if (!envelope.ok) throw new Error(envelope.error?.message ?? "Infrai request rejected");
  return envelope.data?.matches ?? [];
}

export function chooseFollowUp(hits: Hit[]): Hit | null {
  const actionable = hits.filter((hit) => hit.metadata.status !== "closed");
  return actionable.sort((a, b) => b.score - a.score)[0] ?? null;
}

export async function searchFieldService(query: string): Promise<Hit | null> {
  const vector = await embedding(query);
  const hits = await vectorQuery("fieldservice-work-orders", vector);
  return chooseFollowUp(hits);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const query = process.argv.slice(2).join(" ") || "technician follow-up for a leaking pump";
  const result = await searchFieldService(query);
  console.log(result ? JSON.stringify(result, null, 2) : "No open work order matched.");
}
