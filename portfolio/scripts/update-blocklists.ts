// scripts/update-blocklists.ts
import fs from "fs";
import path from "path";

const LISTS = [
    {
        name: "porn",
        url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn-only/hosts",
        output: "lib/moderation/data/porn-domains.json",
    },
    {
        name: "gambling",
        url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/gambling-only/hosts",
        output: "lib/moderation/data/gambling-domains.json",
    },
];

async function run() {
    for (const list of LISTS) {
        const res = await fetch(list.url);
        const text = await res.text();

        const domains = text
            .split("\n")
            .filter((line) => line.startsWith("0.0.0.0 "))
            .map((line) => line.split(" ")[1].trim())
            .filter(Boolean);

        fs.mkdirSync(path.dirname(list.output), { recursive: true });
        fs.writeFileSync(list.output, JSON.stringify(domains));
        console.log(`[${list.name}] ${domains.length} domínios salvos → ${list.output}`);
    }
}

run();