-- Card art chosen in the wall's publish modal (style + light/dark tone).
--
-- Plain TEXT with a database default, so existing rows get a valid value
-- without a backfill. The palette itself is never stored: it is derived from
-- author id + message text in portfolio/components/wall/cardArt.ts.

ALTER TABLE "WallMessage" ADD COLUMN "artStyle" VARCHAR(20) NOT NULL DEFAULT 'mesh';
ALTER TABLE "WallMessage" ADD COLUMN "artTone"  VARCHAR(10) NOT NULL DEFAULT 'dark';
