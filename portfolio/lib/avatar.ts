import { SEEDICON_STYLES, type SeediconStyle } from "seedicon";
import { z } from "zod";

/**
 * Contrato do avatar de usuario, num lugar so.
 *
 * Cada usuario carrega DUAS imagens que coexistem para sempre:
 *
 * - `image` — a foto do Google/GitHub, se ele entrou por OAuth. Nunca e
 *   sobrescrita nem apagada por nada neste arquivo nem pela rota de avatar.
 * - `avatarSeed` + `avatarStyle` — um avatar SVG deterministico gerado pelo
 *   seedicon. Nada de imagem armazenada: a unica coisa no banco e a string.
 *
 * `avatarSource` diz qual das duas renderizar. Trocar de avatar e mudar esse
 * campo (ou gerar um seed novo), nunca destruir a outra opcao.
 *
 * A semente e um UUID e nao o username de proposito: o usuario troca de avatar
 * gerando um UUID novo. Com o username como semente, mudar de avatar exigiria
 * mudar de nome, e mudar de nome trocaria o avatar sem querer.
 */

/** Um dos 17 estilos suportados. `ring`, legado, fica fora deste tipo. */
export type AvatarStyle = SeediconStyle;

/** Estilo de quem acaba de criar conta. E o estilo de marca do proprio pacote. */
export const DEFAULT_AVATAR_STYLE: AvatarStyle = "pixels";

export type AvatarSourceValue = "PROVIDER" | "SEEDICON";

/**
 * O shape minimo que o `<UserAvatar>` precisa. Todo `select` do Prisma que
 * alimenta um avatar tem que devolver estes campos — use `AVATAR_SELECT`.
 */
export type AvatarUser = {
  username: string;
  image: string | null;
  avatarSeed: string;
  avatarStyle: string;
  avatarSource: AvatarSourceValue;
};

/**
 * Para espalhar nos `select` do Prisma: `{ id: true, ...AVATAR_SELECT }`.
 *
 * Existe para que adicionar um campo de avatar no futuro seja uma linha aqui em
 * vez de uma caçada pelos ~10 selects de autor espalhados pelo app.
 */
export const AVATAR_SELECT = {
  username: true,
  image: true,
  avatarSeed: true,
  avatarStyle: true,
  avatarSource: true,
} as const;

/**
 * Validado contra a lista que o pacote exporta em runtime, nao contra nomes
 * escritos a mao aqui. Um `seedicon` novo com mais estilos passa a aceitar os
 * novos sem tocar neste arquivo; e `ring`, que o pacote ainda resolve mas nao
 * lista, e recusado justamente por estar fora de SEEDICON_STYLES.
 */
export const avatarStyleSchema = z
  .string()
  .refine((style): style is AvatarStyle => isAvatarStyle(style));

export function isAvatarStyle(value: string): value is AvatarStyle {
  return (SEEDICON_STYLES as readonly string[]).includes(value);
}

/**
 * O banco guarda `avatarStyle` como texto, entao o que chega no componente e
 * `string`. Esta funcao estreita para o union do pacote, caindo no default em
 * vez de quebrar a renderizacao se o valor for lixo — por exemplo se um estilo
 * for removido numa release futura do seedicon e alguem ainda o tiver salvo.
 */
export function toAvatarStyle(value: string): AvatarStyle {
  return isAvatarStyle(value) ? value : DEFAULT_AVATAR_STYLE;
}

/** Gerado por `crypto.randomUUID()` no cliente; conferido aqui. */
export const avatarSeedSchema = z.string().uuid();

export const avatarSourceSchema = z.enum(["PROVIDER", "SEEDICON"]);

export const avatarPayloadSchema = z.object({
  seed: avatarSeedSchema,
  style: avatarStyleSchema,
  source: avatarSourceSchema,
});

export type AvatarPayload = z.infer<typeof avatarPayloadSchema>;

/** Um seed novo, para o cadastro e para o botao "gerar outro" do modal. */
export function generateAvatarSeed(): string {
  return crypto.randomUUID();
}

/**
 * Decide o que renderizar. Vale tambem como guarda de dados velhos: um usuario
 * marcado como PROVIDER que perdeu a `image` (ou uma linha anterior a migration)
 * cai no seedicon em vez de ficar sem avatar nenhum.
 */
export function usesSeedicon(user: Pick<AvatarUser, "image" | "avatarSource">): boolean {
  return user.avatarSource !== "PROVIDER" || !user.image;
}

/**
 * Monta um `AvatarUser` a partir do que a sessao do NextAuth oferece.
 *
 * Existe porque a sessao e a unica fonte de avatar que NAO passa por um select
 * do Prisma: os campos chegam pelo JWT, logo sao todos opcionais do ponto de
 * vista do tipo. O callback `jwt` em lib/auth.ts recarrega do banco qualquer
 * token que ainda nao os tenha, entao na pratica eles estao sempre la — o
 * retorno `null` cobre so o intervalo entre o deploy e o primeiro refresh.
 *
 * Nao afrouxe o tipo de `UserAvatar` para aceitar esses opcionais direto: e o
 * `AvatarUser` estrito que obriga cada select novo a trazer os campos, em vez
 * de silenciosamente cair no fallback.
 */
export function avatarUserFromSession(user: {
  username?: string | null;
  image?: string | null;
  avatarSeed?: string | null;
  avatarStyle?: string | null;
  avatarSource?: string | null;
}): AvatarUser | null {
  if (!user.avatarSeed) return null;

  return {
    username: user.username ?? "",
    image: user.image ?? null,
    avatarSeed: user.avatarSeed,
    avatarStyle: user.avatarStyle ?? DEFAULT_AVATAR_STYLE,
    avatarSource: user.avatarSource === "PROVIDER" ? "PROVIDER" : "SEEDICON",
  };
}
