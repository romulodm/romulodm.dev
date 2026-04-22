import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import {
  badRequestResponse,
  internalErrorResponse,
  rateLimitResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

/** Hash de transação Ethereum: 0x seguido de 64 hex. */
const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

/** Máximo de "cafés" aceitos por requisição (evita inflação artificial do ranking). */
const MAX_COFFEES = 100;

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);

  // Rate limit: 10 tentativas por IP a cada 10 minutos.
  const ip = getRequestIp(req);
  const limited = await rateLimit(`eth-verify:${ip}`, 10, 600);
  if (limited) {
    return rateLimitResponse(t("common.rateLimited"));
  }

  try {
    const { txHash, coffees, name, message, isPrivate, walletAddress } =
      await req.json();

    // Valida formato do txHash antes de chamar qualquer API externa.
    if (!txHash || !TX_HASH_RE.test(txHash)) {
      return badRequestResponse(t("donations.eth.invalidTransaction"));
    }

    // Impede replay: mesma transação não pode ser registrada duas vezes.
    const existing = await prisma.donation.findFirst({ where: { txHash } });
    if (existing) {
      return badRequestResponse(t("donations.eth.invalidTransaction"));
    }

    // Verifica a transação on-chain via Etherscan.
    const ethRes = await fetch(
      `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash` +
        `&txhash=${txHash}&apikey=${process.env.ETHERSCAN_API_KEY}`,
    );
    const ethData = await ethRes.json();
    const tx = ethData.result;

    if (
      !tx ||
      tx.to?.toLowerCase() !== process.env.ETH_WALLET_ADDRESS?.toLowerCase()
    ) {
      return badRequestResponse(t("donations.eth.invalidTransaction"));
    }

    const amountGwei = parseInt(tx.value, 16);
    // Quantidade de cafés vem do cliente mas é limitada ao range razoável [1, 100].
    const sanitizedCoffees = Math.max(1, Math.min(MAX_COFFEES, Number(coffees) || 1));

    await prisma.donation.create({
      data: {
        coffees: sanitizedCoffees,
        amount: amountGwei,
        currency: "ETH",
        provider: "ETH",
        name: isPrivate ? null : name || null,
        message: message || null,
        isPrivate: Boolean(isPrivate),
        walletAddress,
        txHash,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalErrorResponse(
      "donations-eth-verify",
      error,
      t("common.internalError"),
    );
  }
}
