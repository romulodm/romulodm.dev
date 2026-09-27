// app/api/profile/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { prisma } from "@romulo/database";

import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  rateLimitResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import { authOptions } from "@/lib/auth";
import { avatarPayloadSchema } from "@/lib/avatar";
import { PROFILE_CACHE_TAG } from "@/lib/cache-tags";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Salva a escolha de avatar do usuario.
 *
 * O modal deixa trocar de UUID e de estilo quantas vezes quiser sem tocar na
 * rede — o seedicon gera tudo no cliente. Este endpoint e o unico ponto que
 * grava, e por isso o unico que tem rate limit.
 */

// Trocar de avatar e cosmetico e barato (um UPDATE de tres colunas), entao o
// teto e generoso: serve para experimentar algumas vezes por sessao e ainda
// barrar um script que fique girando UUIDs.
const AVATAR_SAVE_MAX = 10;
const AVATAR_SAVE_WINDOW_SECONDS = 60 * 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return unauthorizedResponse();

    // Chave por usuario, nao por IP: a acao exige sessao, e limitar por IP
    // puniria todo mundo atras do mesmo NAT.
    const limited = await rateLimit(
      `profile:avatar:${userId}`,
      AVATAR_SAVE_MAX,
      AVATAR_SAVE_WINDOW_SECONDS,
    );
    if (limited) {
      return rateLimitResponse(
        "Você trocou de avatar muitas vezes. Tente novamente mais tarde.",
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = avatarPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Avatar inválido.");
    }

    const { seed, style, source } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });
    if (!user) return notFoundResponse("Usuário não encontrado.");

    // Sem esta checagem, um POST cru com source=PROVIDER numa conta sem foto
    // deixaria o usuario sem avatar nenhum para renderizar.
    if (source === "PROVIDER" && !user.image) {
      return badRequestResponse("Esta conta não tem foto de provedor.");
    }

    await prisma.user.update({
      where: { id: userId },
      // `image` fica de fora de proposito: a foto do provider nunca e
      // sobrescrita nem apagada, para o usuario poder voltar para ela sempre.
      data: { avatarSeed: seed, avatarStyle: style, avatarSource: source },
    });

    // O avatar aparece no perfil, no mural e em todo comentario. O modal ja
    // mostra o novo estado localmente; isto e para as outras paginas.
    //
    // A tag e o que importa aqui: `getProfileByUsername` e um unstable_cache
    // com revalidate de 60s, e `revalidatePath` NAO limpa essa entrada —
    // sem invalidar a tag o perfil serviria o avatar antigo por ate um minuto.
    //
    // `{ expire: 0 }` porque o usuario precisa ver a troca imediatamente. O
    // `updateTag`, que seria o natural para read-your-own-writes, so funciona
    // dentro de Server Action — aqui e Route Handler, entao a forma equivalente
    // e o expire zerado.
    revalidateTag(PROFILE_CACHE_TAG, { expire: 0 });
    revalidatePath("/[locale]/profile/[username]", "page");
    revalidatePath("/[locale]/wall", "page");

    return NextResponse.json({ ok: true, seed, style, source });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error, "Avatar inválido.");
    }
    return internalErrorResponse("profile-avatar", error);
  }
}
