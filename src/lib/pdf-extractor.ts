import { readFile } from "fs/promises";
import pdfParse from "pdf-parse";

export interface PdfData {
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    pages?: number;
  };
  text: string;
}

export async function extractPdfData(filePath: string): Promise<PdfData> {
  const dataBuffer = await readFile(filePath);
  const origLog = console.log;
  const origWarn = console.warn;
  console.log = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("private use area"))
      return;
    origLog.apply(console, args);
  };
  console.warn = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("private use area"))
      return;
    origWarn.apply(console, args);
  };
  let data;
  try {
    data = await pdfParse(dataBuffer);
  } finally {
    console.log = origLog;
    console.warn = origWarn;
  }

  return {
    metadata: {
      title: data.info?.Title,
      author: data.info?.Author,
      subject: data.info?.Subject,
      creator: data.info?.Creator,
      producer: data.info?.Producer,
      creationDate: data.info?.CreationDate,
      pages: data.numpages,
    },
    text: data.text.slice(0, 2000),
  };
}

export function formatMetadata(metadata: PdfData["metadata"]): string {
  const lines: string[] = [];

  if (metadata.title) lines.push(`Title: ${metadata.title}`);
  if (metadata.author) lines.push(`Author: ${metadata.author}`);
  if (metadata.subject) lines.push(`Subject: ${metadata.subject}`);
  if (metadata.creator) lines.push(`Creator: ${metadata.creator}`);
  if (metadata.producer) lines.push(`Producer: ${metadata.producer}`);
  if (metadata.creationDate) lines.push(`Created: ${metadata.creationDate}`);
  if (metadata.pages) lines.push(`Pages: ${metadata.pages}`);

  return lines.length > 0 ? lines.join("\n") : "No metadata available";
}
