// import { NeonPostgres } from "@langchain/community/vectorstores/neon";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { Pool } from "@neondatabase/serverless";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export function loadVectorStore() {
  const embeddings = new GoogleGenerativeAIEmbeddings();

  // Uncomment the following lines to load the vector store
  // return new NeonPostgres(embeddings, {
  //   connectionString: process.env.NEON_CONNECTION_STRING as string,
  //   tableName: "documents",
  // });

  // Uncomment
  // const pinecone = new PineconeClient();
  // const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
  // return new PineconeStore(embeddings, {
  //   pineconeIndex,
  //   namespace: process.env.PINECONE_NAMESPACE,
  // });

  return new PGVectorStore(embeddings, {
    pool: new Pool({
      connectionString: process.env.NEON_CONNECTION_STRING as string,
    }),
    tableName: "documents",
    distanceStrategy: "cosine",
  });
}
