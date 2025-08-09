import axios, { AxiosRequestHeaders } from "axios";
import { createClient } from "@supabase/supabase-js";

export type CoinMarketRow = {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  change24hPct: number | null;
  volume24hUsd: number;
};

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Prefer Pro API if key provided; otherwise fall back to public API
const COINGECKO_BASE = COINGECKO_API_KEY
  ? "https://pro-api.coingecko.com/api/v3"
  : "https://api.coingecko.com/api/v3";

// Reasonable default set of meme coins; caller can pass their own IDs later
const DEFAULT_MEME_IDS = [
  "pepe",
  "dogwifcoin",
  "bonk",
  "shiba-inu",
  "floki",
  "baby-doge-coin",
];

export async function getCryptoPrices(coinIds: string[] = DEFAULT_MEME_IDS): Promise<CoinMarketRow[]> {
  const headers: AxiosRequestHeaders = {};
  if (COINGECKO_API_KEY) {
    // CoinGecko Pro header name
    headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
  }

  const { data } = await axios.get(`${COINGECKO_BASE}/coins/markets`, {
    params: {
      vs_currency: "usd",
      ids: coinIds.join(","),
      price_change_percentage: "24h",
      per_page: coinIds.length,
      page: 1,
      sparkline: false,
    },
    headers,
    timeout: 20_000,
  });

  return (data as any[]).map((row) => ({
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    priceUsd: Number(row.current_price ?? 0),
    change24hPct: row.price_change_percentage_24h ?? null,
    volume24hUsd: Number(row.total_volume ?? 0),
  }));
}

export async function getWalletTransactions(address: string, chain: "bsc" | "eth" | "polygon" = "bsc") {
  if (!MORALIS_API_KEY) {
    throw new Error("MORALIS_API_KEY is not set");
  }

  const base = "https://deep-index.moralis.io/api/v2.2";
  const url = `${base}/address/${address}/transactions`;

  const { data } = await axios.get(url, {
    params: { chain, limit: 50, order: "DESC" },
    headers: { "X-API-Key": MORALIS_API_KEY },
    timeout: 20_000,
  });

  return data;
}

export async function saveToDatabase(payload: unknown) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase credentials are not set");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from("analysis_results").insert({
    payload,
    created_at: new Date().toISOString(),
  }).select();

  if (error) {
    throw error;
  }
  return data;
}


