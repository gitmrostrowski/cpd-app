import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  return Response.json({
    message: "API działa. Użyj metody POST.",
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const prompt = body.prompt ?? "";

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  return Response.json({
    text: response.output_text,
  });
}