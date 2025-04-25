"use server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";
import { Runnable } from "@langchain/core/runnables";

const Weather = z
  .object({
    city: z.string().describe("City to search for weather"),
    state: z.string().describe("State abbreviation to search for weather"),
  })
  .describe("Weather search parameters");

export async function executeTool(
  input: string,
  options?: {
    wso?: boolean;
    streamEvents?: boolean;
  },
) {
  "use server";

  const stream = createStreamableValue();

  (async () => {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a helpful assistant. Use the tools provided to best assist the user.`,
      ],
      ["human", "{input}"],
    ]);

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      temperature: 0,
    });

    let chain: Runnable;

    if (options?.wso) {
      chain = prompt.pipe(
        llm.withStructuredOutput(Weather, {
          name: "get_weather",
        }),
      );
    } else {
      chain = prompt.pipe(
        llm.bindTools([
          {
            type: "function",
            function: {
              name: "get_weather",
              description: Weather.description,
              parameters: Weather,
            },
          },
        ]),
      );
    }

    if (options?.streamEvents) {
      const streamResult = chain.streamEvents(
        {
          input,
        },
        {
          version: "v2",
        },
      );

      for await (const item of streamResult) {
        stream.update(JSON.parse(JSON.stringify(item, null, 2)));
      }
    } else {
      const streamResult = await chain.stream({
        input,
      });

      for await (const item of streamResult) {
        stream.update(JSON.parse(JSON.stringify(item, null, 2)));
      }
    }

    stream.done();
  })();

  return { streamData: stream.value };
}
