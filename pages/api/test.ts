import type { NextApiRequest, NextApiResponse } from "next";
import { getCryptoPrices } from "../../lib/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const prices = await getCryptoPrices();
    // Log server-side
    // eslint-disable-next-line no-console
    console.log("Test API - getCryptoPrices():", prices);
    res.status(200).json({ ok: true, count: prices.length, sample: prices.slice(0, 3) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? "Unknown error" });
  }
}


