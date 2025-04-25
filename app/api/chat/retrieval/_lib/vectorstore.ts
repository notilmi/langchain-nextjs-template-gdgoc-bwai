import { NeonPostgres } from "@langchain/community/vectorstores/neon";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export async function loadVectorStore() {
  const embeddings = new GoogleGenerativeAIEmbeddings();
  return await NeonPostgres.initialize(embeddings, {
    connectionString: process.env.NEON_CONNECTION_STRING as string,
  });
}
