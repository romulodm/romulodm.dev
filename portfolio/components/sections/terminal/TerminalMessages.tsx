"use client";

import React, { useEffect, useState } from "react";
import { useTranslations, } from "next-intl";

const SECRET_REWARD_URL = process.env.NEXT_PUBLIC_TERMINAL_SECRET_REWARD ?? "";

function Visitor(): JSX.Element {
    const t = useTranslations("terminal");
    return (
        <div className="text-blue-600 font-semibold dark:text-sky-400">
            {t("visitor")}@romulodm:~$&nbsp;
        </div>
    );
}

interface CommandsObject {
    [key: string]: string;
}

function useAvailableCommands(): CommandsObject {
    const t = useTranslations("terminal");
    return {
        "- help": t("commands.help"),
        "- clear": t("commands.clear"),
        "- initial": t("commands.initial"),
        "- who": t("commands.who"),
        "- whoami": t("commands.whoam"),
        "- follow": t("commands.follow"),
        "- weather": "Clima atual em Rio Grande - RS",
        "- curl quote": "Citação estoica + reflexão",
        "- ping romulo": "Verifica se estou acordado",
        "- cats": t("commands.cats"),
        "- inter": t("commands.inter"),
        "- spotify": t("commands.spotify"),
        "- joke": "Piada de programador",
        "- sudo": "Tente algo proibido",
        "- date": "Data e hora atual",
        "- neofetch": "Informações do sistema (eu)",
        "- secret": t("commands.secret"),
        "- uptime": "Tempo desde que o sistema iniciou",
        "- matrix": "Modo hacker",
        "- hack bank": "Simulação totalmente legal",
        "- coffee": "Fazer café para codar",
    };
}

export function DefaultMessage(): JSX.Element {
    return (
        <div className="font-mono text-sm">
            <div className="text-gray-500 dark:text-neutral-400/90">
                Powershell 3.9.22
            </div>
        </div>
    );
}

interface CommandMessageProps {
    command: string;
}

function getAge(birthDate: Date) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const hasHadBirthdayThisYear =
        today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
            today.getDate() >= birthDate.getDate());

    if (!hasHadBirthdayThisYear) {
        age--;
    }

    return age;
}

async function getRepoCreatedAt() {
    const res = await fetch("https://api.github.com/repos/romulodm/go-chess", {
        next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("Erro ao buscar repo");

    const data = await res.json();
    return new Date(data.created_at);
}

export function UnknowMessage({ command }: CommandMessageProps): JSX.Element {
    const t = useTranslations('terminal');

    return (
        <div className="font-mono text-sm">
            <div className="flex flex-row">
                <Visitor />
                <div className="whitespace-nowrap font-bold dark:text-white/80">{command}</div>
            </div>
            <div className="flex flex-row text-gray-500 dark:text-neutral-400/90">
                <p>{t('not-found-first')}</p> <p className="strong font-bold text-red-500">'help'</p>{t('not-found-second')}
            </div>
        </div>
    );
}

export function HelpMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const cmds = useAvailableCommands();

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">
                        {`help`}
                    </div>
                </div>

                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t("loadings.help")} 20 ms.
                </div>

                <div className="flex px-2 py-3">
                    <div className="w-32 pr-1">
                        {Object.keys(cmds).map((command, index) => (
                            <p className="font-semibold text-red-500" key={index}>
                                {command}
                            </p>
                        ))}
                    </div>
                    <div>
                        {Object.values(cmds).map((description, index) => (
                            <p className="text-gray-500 dark:text-neutral-400/90" key={index}>
                                {description}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function InitialMessage(): JSX.Element {
    const t = useTranslations('terminal');

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`inital`}</div>

                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loadings.initial')} 29 ms.
                </div>
            </div>
            <pre className="text-gray-600 dark:text-neutral-300">
                {`                   
   ____                           | |         | |          
  / __ \\ _ __ ___  _ __ ___  _   _| | ___   __| |_ __ ___  
 / / _\` | '__/ _ \\| '_ \` _ \\| | | | |/ _ \\ / _\` | '_ \` _ \\ 
| | (_| | | | (_) | | | | | | |_| | | (_) | (_| | | | | | |
 \\ \\__,_|_|  \\___/|_| |_| |_|\\__,_|_|\\___/ \\__,_|_| |_| |_|
  \\____/                                             © 2024     
                `}
            </pre>

            <div className="font-mono text-sm">
                <div className="flex flex-row text-gray-500 dark:text-neutral-400/90">
                    <p>{t('initial.content')}</p> <p className="strong font-bold text-red-500">'help'</p>.
                </div>
            </div>
        </div>
    );
}

export function FollowMessage(): JSX.Element {
    const t = useTranslations('terminal');

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`follow`}</div>

                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loadings.follow')} 1337 ms.
                </div>

                <div className="flex ml-5 w-fit flex-col text-purple-400 underline">
                    <a target="_blank" href="https://github.com/romulodm">- GitHub</a>
                    <a target="_blank" href="https://www.linkedin.com/in/romulo-de-moraes-918793258/">- LinkedIn</a>
                    <a target="_blank" href="https://steamcommunity.com/id/rdmzao/">- Steam</a>
                    <a target="_blank" href="https://www.instagram.com/romulo_dmr/">- Instagram</a>
                </div>

            </div>
        </div>
    );
}

export function WhoMessage(): JSX.Element {
    const t = useTranslations('terminal');

    const age = getAge(new Date(2003, 8, 22));

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`who`}</div>

                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loadings.who')} {age} {t('loadings.who-years')}.
                </div>
                <div className="text-gray-500 max-w-[30rem] dark:text-neutral-400/90 flex flex-row">
                    {t('who.so')} <br />
                    {t('who.about')}
                </div>
            </div>
        </div>
    );
}

export function WhoamiMessage(): JSX.Element {
    const t = useTranslations('terminal');

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`whoami`}</div>

                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loadings.whoami')} 2 ms.
                </div>

                <div className="text-gray-500 max-w-[25rem] text-justify dark:text-neutral-400/90 flex flex-row">
                    <br />
                    {t('whoami.title')}
                    <br /><br />
                    {t('whoami.paragraph1')}
                    <br /><br />
                    {t('whoami.paragraph2')}
                    <br /><br />
                    {t('whoami.paragraph3')}
                    <br /><br />
                    {t('whoami.paragraph4')}
                </div>
            </div>
        </div>
    );
}

export function CatsMessage(): JSX.Element {
    const t = useTranslations('terminal');

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`cats`}</div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loadings.cats')} 164 ms.
                </div>
            </div>
            <pre className="dark:text-neutral-400">
                {`
   ,-.       _,---._ __   / \\         ,_    ,_ 
  /  )    .-'       \`./  /   \\        |\\_, -~/
 (  (   ,'            \` /    /|       / _  _ |    ,--.    
  \\  \`-"             \\ '\\   / |      (  @  @ )   / ,-'
   \`.              ,  \\  \\ /  |       \\  _T_/-._( (    
     /\`.          ,'-\`----Y   |       /         \`. \\   
    (            ;        |   '      |         _  \ | meow?
    |  ,-.    ,-'         |  /        \\ \\ ,  /     |     /|、
    |  | (   |   meow-box | /          || |-_\__   /     (˚ˎ 。7
    )  |  \\  \`.___________|/        ((_/\`(____,-'        |、˜〵'
    \`--'   \`--'                                          じしˍ,)ノ

`}
            </pre>
        </div>
    );
}

export function InterMessage(): JSX.Element {
    const t = useTranslations('terminal');

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`inter`}</div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loadings.inter')} 1909 ms.
                </div>
            </div>
            <pre className="bg-red-600 mt-2 mb-2 w-fit text-white">
                {`                   
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠤⠔⠒⣬⠉⠉⣍⡍⠁⢒⠢⠤⣀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⡠⢔⢍⠀⠸⠤⣀⠡⢥⣤⣥⡥⠄⣁⡃⠠⠒⠉⠢⢄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⡠⢊⣠⡀⢈⢤⣢⣵⣾⣿⠟⠛⠛⠟⢿⣿⣾⣵⡢⡀⠎⢀⣑⢄⠀ 
⠀⠀⠀⠀⠀⡔⢅⡀⢁⢔⣵⣿⣿⣿⣿⠿⢶⠀⠀⢰⠳⢿⣿⣿⣿⣷⣕⡐⠘⠈⢢
⠀⠀⠀⠀⡜⠀⠀⠠⣳⣿⣿⣿⣿⠏⠀⣠⣼⠀⠀⢸⣤⠀⠉⢻⣿⣿⣿⣮⢆⢺⠧⢣
⠀⠀⠀⢰⠙⠤⢢⣳⣿⣿⣿⣿⠟⠀⠀⣀⣀⠀⠀⢀⣀⠂⠠⠙⠁⢹⣿⣿⣯⠆⢄⢀⡆
⠀⠀⠀⡆⠀⠀⡌⣿⣿⣿⠟⠁⢸⡀⠀⠈⢻⠀⠀⢸⣧⣀⣿⣶⣄⢸⣿⣿⣿⣼⠈⠁⢰⠀⠀⠀
⠀⠀⠀⡇⠚⠃⣿⣿⣟⠁⠀⠀⢾⣿⣦⣀⣸⠀⠀⢸⠉⠙⠻⣿⣿⣿⣿⣿⣿⣿⠘⠉⢸
⠀⠀⠀⠇⠀⠀⢃⣿⣿⣷⣄⠀⠈⡟⠉⠙⣿⠀⠀⢸⣄⡀⠀⠈⠿⠻⣿⣿⣿⢻⠀⠀⢸
⠀⠀⠀⠸⡀⠀⠘⡽⣿⣿⣿⡷⠜⠀⠀⡰⠛⠒⠒⠚⠛⢱⠀⠀⢸⣾⣿⣿⣟⠆⠀⠀⠇
⠀⠀⠀⠀⢣⠀⠀⠘⡽⣿⣿⣦⣤⡀⠈⠓⠶⠒⠒⢲⠶⠋⠀⣠⣿⣿⣿⢟⠎⠀⠀⡜⠀
⠀⠀⠀⠀⠀⠣⡀⠀⠈⠪⡻⣿⣿⣿⣷⣦⣤⠀⠀⢸⣤⣴⣾⣿⣿⣿⠋⠁⠀⢀⠜⠀
⠀⠀⠀⠀⠀⠀⠑⢄⠀⠀⠈⠚⠝⡻⢿⣿⣤⣤⣠⣤⣴⡿⢿⡻⠑⠁⠀⠀⡠⠊⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠑⠢⣀⠀⠀⠀⡍⠐⢚⡛⢛⣓⠂⡭⡄⠀⠀⣀⠔⠊⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠒⠨⠥⢀⣈⣃⣈⣚⣀⠤⠅⠒⠉⠀⠀ 
                `}
            </pre>
        </div>
    );
}

export function SpotifyMessage(): JSX.Element {
    const t = useTranslations('terminal');

    const iframeStyle: React.CSSProperties = {
        borderRadius: '0px'
    };

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`spotify`}</div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loadings.spotify')} 1337 ms.
                </div>

            </div>
            <div className="py-2 font-mono text-sm">
                <iframe
                    style={iframeStyle}
                    src="https://open.spotify.com/embed/playlist/4Z93kTEkoajtrtsSs9z5W2?utm_source=generator&theme=0"
                    width="90%" height="152"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy">
                </iframe>
                <div className="text-gray-500 dark:text-neutral-400/90 pt-2">
                    {t('spotify.alert')}
                </div>
            </div>

        </div>
    );
}


export function SecretMessage(): JSX.Element {
    const t = useTranslations('terminal');

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`secret`}</div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loadings.secret')} 666 ms.
                </div>
                <div className="flex flex-col text-gray-500 dark:text-neutral-400/90">
                    <p className="flex flex-row">
                        {t('secret.how-fisrt')}
                        <p className="strong font-bold text-red-500">secret --pass '{t('secret.how-try')}'</p>
                        {t('secret.how-second')}
                    </p>

                    <p className="flex flex-row">{t('secret.how-hint')}<p className="strong font-bold text-red-500">'secret --get_hint'</p>.</p>
                </div>
            </div>

        </div>
    );
}

export function SecretHintMessage(): JSX.Element {
    const t = useTranslations('terminal');

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`secret --get_hint`}</div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('secret.hint-time')}
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('secret.hint')}
                </div>
            </div>

        </div>
    );
}

export function SecretWrongMessage({ command }: CommandMessageProps): JSX.Element {
    const t = useTranslations('terminal');

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{command}</div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('secret.wrong')}
                </div>
            </div>

        </div>
    );
}

export function SecretCorrectMessage({ command }: CommandMessageProps): JSX.Element {
    const t = useTranslations("terminal");

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">
                        {command}
                    </div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t("secret.reward")}{" "}
                    <a
                        className="text-purple-400 underline"
                        target="_blank"
                        rel="noreferrer"
                        href={SECRET_REWARD_URL}
                    >
                        reward
                    </a>
                </div>
            </div>
        </div>
    );
}

export function WeatherMessage(): JSX.Element {
    const now = new Date();

    return (
        <div className="font-mono text-sm">
            <div className="flex flex-row">
                <Visitor />
                <div className="font-semibold dark:text-white/80">weather</div>
            </div>

            <div className="text-gray-500 dark:text-neutral-400/90">
                Buscando clima em Rio Grande - RS...
            </div>

            <div className="mt-2 text-gray-700 dark:text-neutral-300">
                🌬️ Vento: 22 km/h<br />
                🌡️ Temperatura: 18°C<br />
                ☁️ Condição: Nublado<br />
                📍 Rio Grande - RS<br />
                🕒 {now.toLocaleTimeString()}
            </div>
        </div>
    );
}

export function QuoteMessage(): JSX.Element {
    return (
        <div className="font-mono text-sm">
            <div className="flex flex-row">
                <Visitor />
                <div className="font-semibold dark:text-white/80">curl quote</div>
            </div>

            <div className="text-gray-500 dark:text-neutral-400/90">
                fetching quote...
            </div>

            <div className="mt-2 text-gray-700 dark:text-neutral-300">
                <p className="italic">
                    "Sustine et abstine"
                </p>

                <p className="mt-2">
                    Suporta e abstém-te.
                </p>

                <p className="mt-2">
                    A ideia é simples, mas poderosa: suportar aquilo que não está sob nosso controle
                    e evitar reagir impulsivamente ao que nos afeta.
                    Em um mundo cheio de distrações e pressões, isso vira quase uma "skill rara".
                </p>
            </div>
        </div>
    );
}

export function PingRomuloMessage(): JSX.Element {
    const now = new Date();

    const saoPauloHour = new Date(
        now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
    ).getHours();

    let status = "";
    let message = "";

    if (saoPauloHour >= 6 && saoPauloHour < 12) {
        status = "🟢 online";
        message = "Provavelmente começando o dia com café ☕";
    } else if (saoPauloHour >= 12 && saoPauloHour < 18) {
        status = "🟢 online";
        message = "Trabalhando / codando 🚀";
    } else if (saoPauloHour >= 18 && saoPauloHour < 24) {
        status = "🟡 maybe online";
        message = "Talvez relaxando ou estudando 📚";
    } else {
        status = "🔴 offline";
        message = "Dormindo 😴 (ou deveria estar)";
    }

    return (
        <div className="font-mono text-sm">
            <div className="flex flex-row">
                <Visitor />
                <div className="font-semibold dark:text-white/80">ping romulo</div>
            </div>

            <div className="text-gray-500 dark:text-neutral-400/90">
                pinging romulo...
            </div>

            <div className="mt-2 text-gray-700 dark:text-neutral-300">
                status: {status}<br />
                {message}<br />
                timezone: America/Sao_Paulo<br />
                hour: {saoPauloHour}:00
            </div>
        </div>
    );
}

export function SudoMessage(): JSX.Element {
    return (
        <div className="font-mono text-sm">
            <div className="flex">
                <Visitor />
                <div className="font-semibold dark:text-white/80">sudo</div>
            </div>

            <div className="mt-2 text-red-500">
                "Permission denied: você não é root 😎"
            </div>
        </div>
    );
}

export function DateMessage(): JSX.Element {
    const now = new Date();

    const formatted = now.toLocaleString("pt-BR", {
        dateStyle: "full",
        timeStyle: "medium",
    });

    let message = "";

    const hour = now.getHours();

    if (hour < 6) message = "🌙 Hora de descansar...";
    else if (hour < 12) message = "☀️ Bora codar!";
    else if (hour < 18) message = "🚀 Produtividade em andamento";
    else message = "🌆 Hora de desacelerar";

    return (
        <div className="font-mono text-sm">
            <div className="flex">
                <Visitor />
                <div className="font-semibold dark:text-white/80">date</div>
            </div>

            <div className="mt-2 text-gray-700 dark:text-neutral-300">
                {formatted}
                <br />
                {message}
            </div>
        </div>
    );
}

export function NeoFetchMessage(): JSX.Element {
    const age = getAge(new Date(2003, 0, 1)); // ajusta se quiser

    return (
        <div className="font-mono text-sm">
            <div className="flex">
                <Visitor />
                <div className="font-semibold dark:text-white/80">neofetch</div>
            </div>

            <div className="mt-2 flex flex-col md:flex-row gap-4">
                <pre className="text-green-500">
                    {`
       /\\
      /  \\       romulo@dev
     /----\\      -------------
    /      \\     OS: HumanOS 1.0
   /  /\\    \\    Host: Rio Grande - RS
  /  /  \\    \\   Kernel: Coffee-driven
 /__/____\\____\\  Uptime: ${age} years
`}
                </pre>

                <div className="text-gray-700 mt-10 dark:text-neutral-300">
                    <p>👨‍💻 Nome: Romulo de Moraes</p>
                    <p>🎂 Idade: {age}</p>
                    <p>📍 Local: Rio Grande - RS</p>
                    <p>💼 Stack: Next.js, Go, Kafka, Redis and more</p>
                    <p>🧠 Interesses: Sistemas distribuídos, backend, Web3</p>
                    <p>⚡ Status: Sempre construindo algo</p>
                </div>
            </div>
        </div>
    );
}

export function UptimeMessage(): JSX.Element {
    const [createdAt, setCreatedAt] = useState<Date | null>(null);
    const [diff, setDiff] = useState(0);

    useEffect(() => {
        async function load() {
            const date = await getRepoCreatedAt();
            setCreatedAt(date);
        }

        load();
    }, []);

    useEffect(() => {
        if (!createdAt) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const seconds = Math.floor((now - createdAt.getTime()) / 1000);
            setDiff(seconds);
        }, 1000);

        return () => clearInterval(interval);
    }, [createdAt]);

    if (!createdAt) {
        return (
            <div className="font-mono text-sm">
                <Visitor />
                <span>loading uptime...</span>
            </div>
        );
    }

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return (
        <div className="font-mono text-sm">
            <div className="flex">
                <Visitor />
                <div className="font-semibold dark:text-white/80">uptime</div>
            </div>

            <div className="mt-2 text-gray-700 dark:text-neutral-300">
                up {days}d {hours}h {minutes}m {seconds}s
            </div>
        </div>
    );
}

export function MatrixMessage(): JSX.Element {
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const randomLine = Math.random().toString(36).substring(2, 12);
            setLines((prev) => [...prev.slice(-10), randomLine]);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="font-mono text-sm text-green-500">
            <div className="flex text-white">
                <Visitor />
                <div className="font-semibold dark:text-white/80">matrix</div>
            </div>

            <div className="mt-2">
                {lines.map((line, i) => (
                    <div key={i}>{line}</div>
                ))}
            </div>
        </div>
    );
}

export function HackBankMessage(): JSX.Element {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("Initializing...");

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                const next = prev + Math.random() * 15;

                if (next >= 100) {
                    clearInterval(interval);
                    setStatus("💰 Transfer complete!");
                    return 100;
                }

                if (next > 70) setStatus("Bypassing firewall...");
                else if (next > 40) setStatus("Injecting payload...");
                else if (next > 10) setStatus("Accessing server...");

                return next;
            });
        }, 300);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="font-mono text-sm">
            <div className="flex">
                <Visitor />
                <div className="font-semibold dark:text-white/80">
                    hack bank
                </div>
            </div>

            <div className="mt-2 text-gray-700 dark:text-neutral-300">
                {status}
                <div className="w-full bg-gray-700 h-2 mt-2 rounded">
                    <div
                        className="bg-green-500 h-2 rounded"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="mt-1">{Math.floor(progress)}%</p>
            </div>
        </div>
    );
}

export function CoffeeMessage(): JSX.Element {
    const [step, setStep] = useState("Brewing coffee...");

    useEffect(() => {
        const timeout = setTimeout(() => {
            setStep("☕ Coffee ready. Now you can code.");
        }, 2000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="font-mono text-sm">
            <div className="flex">
                <Visitor />
                <div className="font-semibold dark:text-white/80">
                    coffee
                </div>
            </div>

            <div className="mt-2 text-gray-700 dark:text-neutral-300">
                {step}
            </div>
        </div>
    );
}

export function JokeMessage(): JSX.Element {
    return (
        <div className="font-mono text-sm">
            <div className="flex">
                <Visitor />
                <div className="font-semibold dark:text-white/80">joke</div>
            </div>

            <div className="text-gray-500 dark:text-neutral-400/90">
                generating joke...
            </div>

            <div className="mt-2 text-gray-700 dark:text-neutral-300">
                Por que programadores programam no escuro??? Porque luz atrai bug 😂 *ba dum tss* 🥁
            </div>
        </div>
    );
}