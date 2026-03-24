import { NextResponse } from "next/server";

export const runtime = "nodejs";

type OptimizeRequestBody = {
  front?: string;
  backEnglish?: string;
  deck?: string;
  notetype?: string;
};

type OptimizeResponseBody = {
  optimizedFront: string;
  optimizedBackEnglish: string;
  explanation: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as {
    output_text?: unknown;
    output?: Array<{
      type?: string;
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text;
  }

  const message = record.output?.find((item) => item.type === "message");
  const text = message?.content?.find((item) => item.type === "output_text");
  return text?.text ?? "";
}

function parseStructuredOutput(payload: unknown) {
  const text = extractOutputText(payload);
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as OptimizeResponseBody;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "缺少 OPENAI_API_KEY 环境变量" },
      { status: 500 },
    );
  }

  let body: OptimizeRequestBody;

  try {
    body = (await request.json()) as OptimizeRequestBody;
  } catch {
    return NextResponse.json(
      { error: "请求体不是合法 JSON" },
      { status: 400 },
    );
  }

  if (!isNonEmptyString(body.front)) {
    return NextResponse.json(
      { error: "`front` 不能为空" },
      { status: 400 },
    );
  }

  if (!isNonEmptyString(body.backEnglish)) {
    return NextResponse.json(
      { error: "`backEnglish` 不能为空" },
      { status: 400 },
    );
  }

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "你是一个英语学习卡片优化助手。",
                "请在不改变学习目标的前提下，优化 Anki 卡片内容。",
                "要求：",
                "1. front 尽量保持原意，必要时只做轻微规范化。",
                "2. backEnglish 改写得更自然、清晰、适合记忆。",
                "3. explanation 用简洁中文说明你做了什么优化。",
                "4. 只返回符合 JSON Schema 的结果。",
              ].join("\n"),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                front: body.front,
                backEnglish: body.backEnglish,
                deck: body.deck ?? "",
                notetype: body.notetype ?? "",
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "anki_card_optimization",
          strict: true,
          schema: {
            type: "object",
            properties: {
              optimizedFront: {
                type: "string",
                description: "优化后的卡片正面文本",
              },
              optimizedBackEnglish: {
                type: "string",
                description: "优化后的英文反面内容",
              },
              explanation: {
                type: "string",
                description: "用简洁中文说明优化点",
              },
            },
            required: [
              "optimizedFront",
              "optimizedBackEnglish",
              "explanation",
            ],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  const openaiPayload = (await openaiResponse.json()) as unknown;

  if (!openaiResponse.ok) {
    return NextResponse.json(
      {
        error: "OpenAI 请求失败",
        details: openaiPayload,
      },
      { status: openaiResponse.status },
    );
  }

  const parsed = parseStructuredOutput(openaiPayload);

  if (!parsed) {
    return NextResponse.json(
      {
        error: "未能解析 AI 返回结果",
        details: openaiPayload,
      },
      { status: 502 },
    );
  }

  return NextResponse.json(parsed);
}
