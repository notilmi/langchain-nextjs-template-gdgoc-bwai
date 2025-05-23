# How to stream agent data to the client

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
> - [Agents](https://js.langchain.com/v0.2/docs/concepts#agents)

## Setup

First, install the necessary LangChain & AI SDK packages:

```bash
npm install langchain @langchain/core @langchain/community ai
```

In this demo we'll be using the `TavilySearchResults` tool, which requires an API key. You can get one [here](https://app.tavily.com/), or you can swap it out for another tool of your choice, like
[`WikipediaQueryRun`](https://js.langchain.com/v0.2/docs/integrations/tools/wikipedia) which doesn't require an API key.

If you choose to use `TavilySearchResults`, set your API key like so:

```bash
export TAVILY_API_KEY=your_api_key
```

## Get started

The first step is to create a new RSC file, and add the imports which we'll use for running our agent. In this demo, we'll name it `action.ts`:

```typescript action.ts
"use server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { createStreamableValue } from "ai/rsc";
```

Next, we'll define a `runAgent` function. This function takes in a single input of `string`, and contains all the logic for our agent and streaming data back to the client:

```typescript action.ts
export async function runAgent(input: string) {
  "use server";
}
```

Next, inside our function we'll define our chat model of choice:

```typescript action.ts
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0,
});
```

Next, we'll use the `createStreamableValue` helper function provided by the `ai` package to create a streamable value:

```typescript action.ts
const stream = createStreamableValue();
```

This will be very important later on when we start streaming data back to the client.

Next, lets define our async function inside which contains the agent logic:

```typescript action.ts
  (async () => {
    const tools = [new TavilySearchResults({ maxResults: 1 })];

    const prompt = await pull<ChatPromptTemplate>(
      "hwchase17/openai-tools-agent",
    );

    const agent = createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
    });
```

Here you can see we're doing a few things:

The first is we're defining our list of tools (in this case we're only using a single tool) and pulling in our prompt from the LangChain prompt hub.

After that, we're passing our LLM, tools and prompt to the `createToolCallingAgent` function, which will construct and return a runnable agent.
This is then passed into the `AgentExecutor` class, which will handle the execution & streaming of our agent.

Finally, we'll call `.streamEvents` and pass our streamed data back to the `stream` variable we defined above,

```typescript action.ts
    const streamingEvents = agentExecutor.streamEvents(
      { input },
      { version: "v1" },
    );

    for await (const item of streamingEvents) {
      stream.update(JSON.parse(JSON.stringify(item, null, 2)));
    }

    stream.done();
  })();
```

As you can see above, we're doing something a little wacky by stringifying and parsing our data. This is due to a bug in the RSC streaming code,
however if you stringify and parse like we are above, you shouldn't experience this.

Finally, at the bottom of the function return the stream value:

```typescript action.ts
return { streamData: stream.value };
```

Once we've implemented our server action, we can add a couple lines of code in our client function to request and stream this data:

First, add the necessary imports:

```typescript page.tsx
"use client";

import { useState } from "react";
import { readStreamableValue } from "ai/rsc";
import { runAgent } from "./action";
```

Then inside our `Page` function, calling the `runAgent` function is straightforward:

```typescript page.tsx
export default function Page() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<StreamEvent[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { streamData } = await runAgent(input);
    for await (const item of readStreamableValue(streamData)) {
      setData((prev) => [...prev, item]);
    }
  }
}
```

That's it! You've successfully built an agent that streams data back to the client. You can now run your application and see the data streaming in real-time.
