/**
 * Single list of the interactive terminal's commands. `help`, `man`, Tab
 * completion and the "did you mean" suggestion all read from here, so a new
 * command only needs an entry below plus its i18n keys
 * (`terminal.commands.<key>` and `terminal.man.pages.<key>`).
 */

export type ArgPlaceholder = "text" | "command";

export interface CatalogEntry {
    /** What the visitor types. May contain spaces ("git log"). */
    name: string;
    /** i18n key under `terminal.commands` and `terminal.man.pages`. */
    key: string;
    /** Literal flags or choices, shown as-is in `man` ("[--latest]", "pt|en"). */
    options?: string;
    /** Free-form argument, shown translated in `man` ("<texto>" / "<text>"). */
    arg?: ArgPlaceholder;
}

export const CATALOG: readonly CatalogEntry[] = [
    { name: "help", key: "help" },
    { name: "clear", key: "clear" },
    { name: "initial", key: "initial" },
    { name: "who", key: "who" },
    { name: "whoami", key: "whoami" },
    { name: "follow", key: "follow" },
    { name: "papers", key: "papers" },
    { name: "blog", key: "blog", options: "[--latest]" },
    { name: "git log", key: "git-log", options: "[--oneline]" },
    { name: "visitors", key: "visitors" },
    { name: "weather", key: "weather" },
    { name: "curl quote", key: "quote" },
    { name: "ping romulo", key: "ping" },
    { name: "cats", key: "cats" },
    { name: "inter", key: "inter" },
    { name: "spotify", key: "spotify" },
    { name: "joke", key: "joke" },
    { name: "sudo", key: "sudo" },
    { name: "date", key: "date" },
    { name: "neofetch", key: "neofetch" },
    { name: "top", key: "top" },
    { name: "htop", key: "htop" },
    { name: "uptime", key: "uptime" },
    { name: "matrix", key: "matrix" },
    { name: "hack bank", key: "hack-bank" },
    { name: "coffee", key: "coffee" },
    { name: "npm install", key: "npm-install" },
    { name: "sl", key: "sl" },
    { name: "cowsay", key: "cowsay", arg: "text" },
    { name: "seedicon", key: "seedicon", arg: "text" },
    { name: "wordmark", key: "wordmark", arg: "text" },
    { name: "man", key: "man", arg: "command" },
    { name: "history", key: "history" },
    { name: "secret", key: "secret", options: "[--get_hint | --pass <0000>]" },
    { name: "exit", key: "exit" },
];

export function findEntry(name: string): CatalogEntry | undefined {
    const normalized = name.trim().toLowerCase();
    return CATALOG.find((entry) => entry.name === normalized);
}

/**
 * Every full line Tab can complete to. Sub-options are listed explicitly so
 * "blog --" completes to "blog --latest" and "man co" to "man coffee".
 */
const COMPLETIONS: readonly string[] = [
    ...CATALOG.map((entry) => entry.name),
    "blog --latest",
    "git log --oneline",
    "secret --get_hint",
    ...CATALOG.map((entry) => `man ${entry.name}`),
];

/** Commands that are useless without an argument, so completion adds a space. */
const NEEDS_ARGUMENT = new Set(
    CATALOG.filter((entry) => entry.arg).map((entry) => entry.name),
);

function commonPrefix(values: readonly string[]): string {
    let prefix = values[0] ?? "";
    for (const value of values) {
        while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
    }
    return prefix;
}

export interface Completion {
    /** The new input value (unchanged when there is nothing to add). */
    value: string;
    /**
     * Candidates to print when the input cannot be extended any further, as
     * the word being completed only ("clear", "coffee"), like a shell does.
     */
    options: string[];
}

export function complete(input: string): Completion {
    const typed = input.replace(/^\s+/, "").toLowerCase();
    const matches = COMPLETIONS.filter((candidate) => candidate.startsWith(typed) && candidate !== typed);

    if (matches.length === 0) {
        return { value: input, options: [] };
    }

    if (matches.length === 1) {
        const [match] = matches;
        return { value: NEEDS_ARGUMENT.has(match) ? `${match} ` : match, options: [] };
    }

    const prefix = commonPrefix(matches);
    if (prefix.length > typed.length) {
        return { value: prefix, options: [] };
    }

    // Show only the part after the last complete word, as bash does.
    const wordStart = typed.lastIndexOf(" ") + 1;
    const options = [...new Set(matches.map((match) => match.slice(wordStart)))];
    return { value: input, options };
}

/**
 * Edit distance where swapping two adjacent letters counts as one edit
 * (optimal string alignment), since "hlep" and "cofefe" are the typos people
 * actually make.
 */
function editDistance(a: string, b: string): number {
    const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
        Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
        }
    }

    return d[a.length][b.length];
}

/**
 * The closest command to an unknown input, or null when nothing is close
 * enough to be a plausible typo. Short names tolerate one edit, longer ones
 * two, so short words do not all match something. "ls" does get "sl", which
 * is the joke `sl` exists for.
 */
export function suggestCommand(input: string): string | null {
    const typed = input.trim().toLowerCase();
    if (!typed) return null;

    let best: { name: string; distance: number } | null = null;

    for (const { name } of CATALOG) {
        // Compare against as many words as the command has, so "cowsay hi"
        // typed as "cowsya hi" is still matched on "cowsya".
        const words = name.split(" ").length;
        const head = typed.split(/\s+/).slice(0, words).join(" ");
        const distance = editDistance(head, name);
        const tolerance = name.length <= 4 ? 1 : 2;

        if (distance > 0 && distance <= tolerance && (!best || distance < best.distance)) {
            best = { name, distance };
        }
    }

    return best?.name ?? null;
}
