"use server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { SystemMessage } from "@langchain/core/messages";
import { createStreamableValue } from "ai/rsc";

export async function runAgent(input: string) {
  "use server";

  const stream = createStreamableValue();

  (async () => {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      temperature: 0,
      maxRetries: 2,
    });

    const tools = [new TavilySearchResults()];

    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(`You are a helpful AI assistant. Your goal is to help the user by using the tools available to you.
When you use a tool, be sure to reason step by step:
1. What information do you need to find?
2. Which tool would be most helpful?
3. What parameters should you pass to the tool?
4. What did you learn from the tool output?

Always aim to provide accurate, helpful, and informative responses.`),
    ]);

    const agent = await createToolCallingAgent({
      llm: model,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
    });

    const result = await agentExecutor.streamEvents(
      {
        input,
      },
      {
        version: "v1",
      },
    );

    for await (const chunk of result) {
      stream.update(chunk);
    }

    stream.done();
  })();

  return { streamData: stream.value };
}
