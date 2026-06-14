import type * as Phaser from "phaser";

export interface TiledProps { [key: string]: string | number | boolean }

/** Convert a Tiled object's properties array into a plain map. */
export function readProps(obj: Phaser.Types.Tilemaps.TiledObject): TiledProps {
  const out: TiledProps = {};
  const props = (obj as unknown as { properties?: Array<{ name: string; value: unknown }> }).properties;
  if (Array.isArray(props)) {
    for (const p of props) out[p.name] = p.value as string | number | boolean;
  }
  return out;
}

/** Strip trailing _N / digits so "door_2" → "door", "fishing 3" → "fishing". */
export function baseName(name: string | undefined): string {
  if (!name) return "";
  return name.toLowerCase().replace(/[\s_-]*\d+$/, "").trim();
}

/**
 * Resolve the "kind" of an object using, in order:
 *   1. custom property `kind`
 *   2. Tiled class/type field
 *   3. the object Name (with trailing numbers stripped)
 */
export function objectKind(obj: Phaser.Types.Tilemaps.TiledObject, props: TiledProps): string {
  if (typeof props.kind === "string") return props.kind.toLowerCase();
  const cls = (obj as unknown as { type?: string }).type;
  if (cls) return cls.toLowerCase();
  return baseName(obj.name);
}
