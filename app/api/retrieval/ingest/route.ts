import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { Pool } from "@neondatabase/serverless";
// import { NeonPostgres } from "@langchain/community/vectorstores/neon";
// import { PineconeStore } from "@langchain/pinecone";
// import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = body.text;

  if (process.env.NEXT_PUBLIC_DEMO === "true") {
    return NextResponse.json(
      {
        error: [
          "Ingest is not supported in demo mode.",
          "Please set up your own version of the repo here: https://github.com/langchain-ai/langchain-nextjs-template",
        ].join("\n"),
      },
      { status: 403 },
    );
  }

  try {
    const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
      chunkSize: 256,
      chunkOverlap: 20,
    });

    const splitDocuments = await splitter.createDocuments([text]);

    // Uncomment the following lines to use Pinecone
    // const pinecone = new PineconeClient();
    // const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
    // await PineconeStore.fromDocuments(
    //   splitDocuments,
    //   new GoogleGenerativeAIEmbeddings(),
    //   {
    //     pineconeIndex,
    //     namespace: "documents",
    //   },
    // );

    // Uncomment the following lines to use Neon
    // await NeonPostgres.fromDocuments(
    //   splitDocuments,
    //   new GoogleGenerativeAIEmbeddings(),
    //   {
    //     connectionString: process.env.NEON_CONNECTION_STRING as string,
    //     tableName: "documents",
    //   },
    // );

    await PGVectorStore.fromDocuments(
      splitDocuments,
      new GoogleGenerativeAIEmbeddings(),
      {
        pool: new Pool({
          connectionString: process.env.NEON_CONNECTION_STRING as string,
        }),
        tableName: "documents",
        distanceStrategy: "cosine",
      },
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
