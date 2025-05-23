# How to stream structured output to the client

This guide will walk you through how we stream agent data to the client using [React Server Components](https://react.dev/reference/rsc/server-components) inside this directory.
The code in this doc is taken from the `page.tsx` and `action.ts` files in this directory. To view the full, uninterrupted code, click [here for the actions file](./action.ts)
and [here for the client file](./page.tsx).

> ## Prerequisites
>
> This guide assumes familiarity with the following concepts:
>
> - [LangChain Expression Language](https://js.langchain.com/v0.2/docs/concepts#langchain-expression-language)
> - [Chat models](https://js.langchain.com/v0.2/docs/concepts#chat-models)
> - [Tool calling](https://js.langchain.com/v0.2/docs/concepts#functiontool-calling)

## Setup

First, install the necessary LangChain & AI SDK packages:

```bash
npm install @langchain/openai @langchain/core ai zod zod-to-json-schema
```

Next, we'll create our server file.
This will contain all the logic for making tool calls and sending the data back to the client.

Start by adding the necessary imports & the `"use server"` directive:

```typescript
"use server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { JsonOutputKeyToolsParser } from "@langchain/core/output_parsers/openai_tools";
```

After that, we'll define our tool schema. For this example we'll use a simple demo weather schema:

```typescript
const Weather = z
  .object({
    city: z.string().describe("City to search for weather"),
    state: z.string().describe("State abbreviation to search for weather"),
  })
  .describe("Weather search parameters");
```

Once our schema is defined, we can implement our `executeTool` function.
This function takes in a single input of `string`, and contains all the logic for our tool and streaming data back to the client:

```typescript
export async function executeTool(
  input: string,
) {
  "use server";

  const stream = createStreamableValue();
```

The `createStreamableValue` function is important as this is what we'll use for actually streaming all the data back to the client.

For the main logic, we'll wrap it in an async function. Start by defining our prompt and chat model:

```typescript
  (async () => {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a helpful assistant. Use the tools provided to best assist the user.`,
      ],
      ["human", "{input}"],
    ]);

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
    });

```

After defining our chat model, we'll define our runnable chain using LCEL.

We start binding our `weather` tool we defined earlier to the model:

```typescript
const modelWithTools = llm.bind({
  tools: [
    {
      type: "function" as const,
      function: {
        name: "get_weather",
        description: Weather.description,
        parameters: zodToJsonSchema(Weather),
      },
    },
  ],
});
```

Next, we'll use LCEL to pipe each component together, starting with the prompt, then the model with tools, and finally the output parser:

```typescript
const chain = prompt.pipe(modelWithTools).pipe(
  new JsonOutputKeyToolsParser<z.infer<typeof Weather>>({
    keyName: "get_weather",
    zodSchema: Weather,
  }),
);
```

Finally, we'll call `.stream` on our chain, and similarly to the [streaming agent](../agent/README.md)
example, we'll iterate over the stream and stringify + parse the data before updating the stream value:

```typescript
    const streamResult = await chain.stream({
      input,
    });

    for await (const item of streamResult) {
      stream.update(JSON.parse(JSON.stringify(item, null, 2)));
    }

    stream.done();
  })();

  return { streamData: stream.value };
}
```
