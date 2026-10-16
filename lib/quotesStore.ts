import fs from "fs";
import path from "path";

export interface StoredQuote {
  id: string;
  clientCpf: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  tattooDescription: string;
  sizeCm: string;
  style: string;
  totalPrice: number;
  estimatedDurationHours: number;
  sessionsCount?: number;
  depositAmount: number;
  status: "PENDENTE" | "APROVADO" | "RECUSADO";
  notes?: string;
  images?: any[];
  createdAt: string;
  updatedAt: string;
}

const MEMORY_QUOTES: Map<string, StoredQuote> = new Map();

function getStorageFilePath(): string {
  // Em ambiente Vercel (serverless readonly filesystem), usa /tmp
  if (process.env.VERCEL) {
    return path.join("/tmp", "guinknass_quotes.json");
  }
  return path.join(process.cwd(), "quotes_cache.json");
}

function loadQuotes(): StoredQuote[] {
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("[quotesStore] Aviso ao ler arquivo:", err);
  }
  return Array.from(MEMORY_QUOTES.values());
}

function saveQuotesToFile(quotes: StoredQuote[]) {
  try {
    const filePath = getStorageFilePath();
    fs.writeFileSync(filePath, JSON.stringify(quotes, null, 2), "utf-8");
  } catch (err) {
    console.warn("[quotesStore] Aviso ao salvar arquivo:", err);
  }
}

export function saveOrUpdateQuote(quote: StoredQuote): StoredQuote {
  const cleanCpf = quote.clientCpf.replace(/\D/g, "");
  quote.clientCpf = cleanCpf;
  MEMORY_QUOTES.set(cleanCpf, quote);

  const all = loadQuotes().filter((q) => q.clientCpf !== cleanCpf);
  all.push(quote);
  saveQuotesToFile(all);
  return quote;
}

export function findQuoteByCpf(rawCpf: string): StoredQuote | null {
  const cleanCpf = rawCpf.replace(/\D/g, "");
  if (MEMORY_QUOTES.has(cleanCpf)) {
    return MEMORY_QUOTES.get(cleanCpf)!;
  }
  const all = loadQuotes();
  const found = all.find((q) => q.clientCpf === cleanCpf);
  if (found) {
    MEMORY_QUOTES.set(cleanCpf, found);
    return found;
  }
  return null;
}
