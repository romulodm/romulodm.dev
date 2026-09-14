-- Avatares gerados pelo seedicon a partir de um UUID por usuario.
--
-- Escrita a mao em vez de gerada porque `avatarSeed` e NOT NULL sem default de
-- banco: o `uuid()` do Prisma roda no client, entao um ALTER TABLE direto
-- quebraria em qualquer tabela que ja tenha linhas. O caminho aqui e adicionar
-- nullable, preencher com gen_random_uuid() (built-in do Postgres 13+), e so
-- depois exigir NOT NULL.

CREATE TYPE "AvatarSource" AS ENUM ('PROVIDER', 'SEEDICON');

ALTER TABLE "User" ADD COLUMN "avatarSeed"   TEXT;
ALTER TABLE "User" ADD COLUMN "avatarStyle"  TEXT NOT NULL DEFAULT 'pixels';
ALTER TABLE "User" ADD COLUMN "avatarSource" "AvatarSource" NOT NULL DEFAULT 'SEEDICON';

UPDATE "User" SET "avatarSeed" = gen_random_uuid()::text WHERE "avatarSeed" IS NULL;

ALTER TABLE "User" ALTER COLUMN "avatarSeed" SET NOT NULL;

-- Quem ja tem foto do provider continua com ela. Sem este backfill, todo
-- usuario de Google/GitHub trocaria de cara no momento do deploy — o seedicon
-- fica gerado e esperando no modal, mas nao entra em cena sem o usuario pedir.
UPDATE "User" SET "avatarSource" = 'PROVIDER' WHERE "image" IS NOT NULL;
