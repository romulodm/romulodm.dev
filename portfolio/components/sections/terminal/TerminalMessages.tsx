"use client";

import React, { useEffect, useState, type JSX, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

const SECRET_REWARD_URL = process.env.NEXT_PUBLIC_TERMINAL_SECRET_REWARD ?? "";

const BIRTH_DATE = new Date(2003, 8, 22);

/*
 * The only fixed "loading time" in the interactive terminal. 1909 is the year
 * SC Internacional was founded, and the `secret` riddle hints that the password
 * is a year shown somewhere in this terminal, so this value must stay constant.
 */
const INTER_FOUNDATION_YEAR = 1909;

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/**
 * Picks a fake loading time once per mounted output, so re-renders keep the
 * same number. Outputs only mount on the client, after the visitor opens the
 * interactive tab, which is why a random initial state cannot cause a hydration
 * mismatch here. Callers keep ranges below 1000 so no random value reads like a
 * four-digit year and muddles the `secret` riddle.
 */
function useFakeLoadTime(min: number, max: number): number {
    const [ms] = useState(() => Math.floor(min + Math.random() * (max - min + 1)));
    return ms;
}

function useIntlLocale(): string {
    return useLocale() === "pt" ? "pt-BR" : "en-US";
}

function formatSeconds(ms: number, intlLocale: string): string {
    return new Intl.NumberFormat(intlLocale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(ms / 1000);
}

function getAge(birthDate: Date): number {
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

async function getRepoCreatedAt(): Promise<Date> {
    const res = await fetch("https://api.github.com/repos/romulodm/go-chess");

    if (!res.ok) throw new Error(`GitHub responded with ${res.status}`);

    const data = await res.json();
    return new Date(data.created_at);
}

function Visitor(): JSX.Element {
    const t = useTranslations("terminal");
    return (
        <div className="text-blue-600 font-semibold dark:text-sky-400">
            {t("visitor")}@romulodm:~$&nbsp;
        </div>
    );
}

/** The echoed prompt line: `visitor@romulodm:~$ <command>`. */
function Prompt({ command }: { command: string }): JSX.Element {
    return (
        <div className="flex flex-row">
            <Visitor />
            <div className="whitespace-nowrap font-semibold dark:text-white/80">{command}</div>
        </div>
    );
}

function Muted({ children, className = "" }: { children: ReactNode; className?: string }): JSX.Element {
    return <div className={`text-gray-500 dark:text-neutral-400/90 ${className}`}>{children}</div>;
}

function Output({ children, className = "" }: { children: ReactNode; className?: string }): JSX.Element {
    return <div className={`mt-2 text-gray-700 dark:text-neutral-300 ${className}`}>{children}</div>;
}

function Spinner(): JSX.Element {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
        }, 80);

        return () => clearInterval(interval);
    }, []);

    return (
        <span aria-hidden="true" className="inline-block w-[1ch]">
            {SPINNER_FRAMES[frame]}
        </span>
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
        "- whoami": t("commands.whoami"),
        "- follow": t("commands.follow"),
        "- weather": t("commands.weather"),
        "- curl quote": t("commands.quote"),
        "- ping romulo": t("commands.ping"),
        "- cats": t("commands.cats"),
        "- inter": t("commands.inter"),
        "- spotify": t("commands.spotify"),
        "- joke": t("commands.joke"),
        "- sudo": t("commands.sudo"),
        "- date": t("commands.date"),
        "- neofetch": t("commands.neofetch"),
        "- secret": t("commands.secret"),
        "- uptime": t("commands.uptime"),
        "- matrix": t("commands.matrix"),
        "- hack bank": t("commands.hack-bank"),
        "- coffee": t("commands.coffee"),
    };
}

export function DefaultMessage(): JSX.Element {
    return (
        <div className="font-mono text-sm">
            <Muted>Powershell 3.9.22</Muted>
        </div>
    );
}

interface CommandMessageProps {
    command: string;
}

/** Output for an empty Enter: a bare prompt line, like a real shell. */
export function EmptyPromptMessage(): JSX.Element {
    return (
        <div className="font-mono text-sm">
            <Prompt command="" />
        </div>
    );
}

export function UnknowMessage({ command }: CommandMessageProps): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(300, 900);

    return (
        <div className="font-mono text-sm">
            <Prompt command={command} />
            <Muted>{t("loadings.unknown", { ms })}</Muted>
            <div className="flex flex-row text-gray-500 dark:text-neutral-400/90">
                <p>{t("not-found-first")}</p> <p className="strong font-bold text-red-500">'help'</p>{t("not-found-second")}
            </div>
        </div>
    );
}

export function HelpMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const cmds = useAvailableCommands();
    const ms = useFakeLoadTime(5, 40);

    return (
        <div className="font-mono text-sm">
            <Prompt command="help" />
            <Muted>{t("loadings.help", { ms })}</Muted>

            <div className="flex px-2 py-3">
                <div className="w-32 pr-1">
                    {Object.keys(cmds).map((command) => (
                        <p className="font-semibold text-red-500" key={command}>
                            {command}
                        </p>
                    ))}
                </div>
                <div>
                    {Object.entries(cmds).map(([command, description]) => (
                        <p className="text-gray-500 dark:text-neutral-400/90" key={command}>
                            {description}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function InitialMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(10, 60);

    return (
        <div>
            <div className="font-mono text-sm">
                <Prompt command="initial" />
                <Muted>{t("loadings.initial", { ms })}</Muted>
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
                    <p>{t("initial.content")}</p> <p className="strong font-bold text-red-500">'help'</p>.
                </div>
            </div>
        </div>
    );
}

export function FollowMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(100, 600);

    return (
        <div className="font-mono text-sm">
            <Prompt command="follow" />
            <Muted>{t("loadings.follow", { ms })}</Muted>

            <div className="flex ml-5 w-fit flex-col text-purple-400 underline">
                <a target="_blank" rel="noreferrer" href="https://github.com/romulodm">- GitHub</a>
                <a target="_blank" rel="noreferrer" href="https://www.linkedin.com/in/romulo-de-moraes-918793258/">- LinkedIn</a>
                <a target="_blank" rel="noreferrer" href="https://steamcommunity.com/id/rdmzao/">- Steam</a>
                <a target="_blank" rel="noreferrer" href="https://www.instagram.com/romulo_dmr/">- Instagram</a>
            </div>
        </div>
    );
}

export function WhoMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const age = getAge(BIRTH_DATE);

    return (
        <div className="font-mono text-sm">
            <Prompt command="who" />
            {/* The "loading time" here is the age itself, on purpose. */}
            <Muted>{t("loadings.who", { age })}</Muted>
            <Muted className="max-w-[30rem]">
                {t("who.so")}
                <br />
                {t("who.about", { age })}
            </Muted>
        </div>
    );
}

export function WhoamiMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(2, 15);

    return (
        <div className="font-mono text-sm">
            <Prompt command="whoami" />
            <Muted>{t("loadings.whoami", { ms })}</Muted>

            <Muted className="max-w-[25rem] text-justify">
                <br />
                {t("whoami.title")}
                <br /><br />
                {t("whoami.paragraph1")}
                <br /><br />
                {t("whoami.paragraph2")}
                <br /><br />
                {t("whoami.paragraph3")}
                <br /><br />
                {t("whoami.paragraph4")}
            </Muted>
        </div>
    );
}

export function CatsMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(150, 700);

    return (
        <div>
            <div className="font-mono text-sm">
                <Prompt command="cats" />
                <Muted>{t("loadings.cats", { ms })}</Muted>
            </div>
            <pre className="dark:text-neutral-400">
                {`
   ,-.       _,---._ __   / \\         ,_    ,_ 
  /  )    .-'       \`./  /   \\        |\\_, -~/
 (  (   ,'            \` /    /|       / _  _ |    ,--.    
  \\  \`-"             \\ '\\   / |      (  @  @ )   / ,-'
   \`.              ,  \\  \\ /  |       \\  _T_/-._( (    
     /\`.          ,'-\`----Y   |       /         \`. \\   
    (            ;        |   '      |         _  \\ | meow?
    |  ,-.    ,-'         |  /        \\ \\ ,  /     |     /|、
    |  | (   |   meow-box | /          || |-_\\__   /     (˚ˎ 。7
    )  |  \\  \`.___________|/        ((_/\`(____,-'        |、˜〵'
    \`--'   \`--'                                          じしˍ,)ノ

`}
            </pre>
        </div>
    );
}

export function InterMessage(): JSX.Element {
    const t = useTranslations("terminal");

    return (
        <div>
            <div className="font-mono text-sm">
                <Prompt command="inter" />
                <Muted>{t("loadings.inter", { ms: INTER_FOUNDATION_YEAR })}</Muted>
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
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(200, 900);

    const iframeStyle: React.CSSProperties = {
        borderRadius: "0px",
    };

    return (
        <div>
            <div className="font-mono text-sm">
                <Prompt command="spotify" />
                <Muted>{t("loadings.spotify", { ms })}</Muted>
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
                <Muted className="pt-2">{t("spotify.alert")}</Muted>
            </div>
        </div>
    );
}

export function SecretMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(100, 666);

    return (
        <div className="font-mono text-sm">
            <Prompt command="secret" />
            <Muted>{t("loadings.secret", { ms })}</Muted>
            <Muted className="flex flex-col">
                <p className="flex flex-row">
                    {t("secret.how-first")}
                    <span className="strong font-bold text-red-500">secret --pass '{t("secret.how-try")}'</span>
                    {t("secret.how-second")}
                </p>

                <p className="flex flex-row">
                    {t("secret.how-hint")}
                    <span className="strong font-bold text-red-500">'secret --get_hint'</span>.
                </p>
            </Muted>
        </div>
    );
}

export function SecretHintMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(1, 30);

    return (
        <div className="font-mono text-sm">
            <Prompt command="secret --get_hint" />
            <Muted>{t("loadings.secret-hint", { ms })}</Muted>
            <Muted>{t("secret.hint")}</Muted>
        </div>
    );
}

export function SecretWrongMessage({ command }: CommandMessageProps): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(1, 15);

    return (
        <div className="font-mono text-sm">
            <Prompt command={command} />
            <Muted>{t("loadings.secret-wrong", { ms })}</Muted>
        </div>
    );
}

export function SecretCorrectMessage({ command }: CommandMessageProps): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(300, 900);

    return (
        <div className="font-mono text-sm">
            <Prompt command={command} />
            <Muted>{t("loadings.secret-correct", { ms })}</Muted>
            <Muted>
                {t("secret.reward")}{" "}
                <a
                    className="text-purple-400 underline"
                    target="_blank"
                    rel="noreferrer"
                    href={SECRET_REWARD_URL}
                >
                    reward
                </a>
            </Muted>
        </div>
    );
}

export function WeatherMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const intlLocale = useIntlLocale();
    const ms = useFakeLoadTime(100, 500);
    const [now] = useState(() => new Date());

    return (
        <div className="font-mono text-sm">
            <Prompt command="weather" />
            <Muted>{t("loadings.weather", { ms })}</Muted>

            <Output>
                🌬️ {t("weather.wind")}: 22 km/h<br />
                🌡️ {t("weather.temperature")}: 18°C<br />
                ☁️ {t("weather.condition")}: {t("weather.cloudy")}<br />
                📍 Rio Grande - RS<br />
                🕒 {now.toLocaleTimeString(intlLocale)}
            </Output>
        </div>
    );
}

export function QuoteMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(100, 800);

    return (
        <div className="font-mono text-sm">
            <Prompt command="curl quote" />
            <Muted>{t("loadings.quote", { ms })}</Muted>

            <Output>
                <p className="italic">"Sustine et abstine"</p>
                <p className="mt-2">{t("quote.translation")}</p>
                <p className="mt-2 max-w-[30rem]">{t("quote.reflection")}</p>
            </Output>
        </div>
    );
}

export function PingRomuloMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(12, 250);
    const [saoPauloHour] = useState(() =>
        new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })).getHours()
    );

    let status: string;
    let message: string;

    if (saoPauloHour >= 6 && saoPauloHour < 12) {
        status = t("ping.online");
        message = t("ping.morning");
    } else if (saoPauloHour >= 12 && saoPauloHour < 18) {
        status = t("ping.online");
        message = t("ping.afternoon");
    } else if (saoPauloHour >= 18 && saoPauloHour < 24) {
        status = t("ping.maybe");
        message = t("ping.evening");
    } else {
        status = t("ping.offline");
        message = t("ping.night");
    }

    return (
        <div className="font-mono text-sm">
            <Prompt command="ping romulo" />
            <Muted>{t("loadings.ping", { ms })}</Muted>

            <Output>
                status: {status}<br />
                {message}<br />
                {t("ping.timezone")}: America/Sao_Paulo<br />
                {t("ping.hour")}: {saoPauloHour}:00
            </Output>
        </div>
    );
}

export function SudoMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(1, 3);

    return (
        <div className="font-mono text-sm">
            <Prompt command="sudo" />
            <Muted>{t("loadings.sudo", { ms })}</Muted>

            <div className="mt-2 text-red-500">{t("sudo.denied")}</div>
            <Muted>{t("sudo.reported")}</Muted>
        </div>
    );
}

export function DateMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const intlLocale = useIntlLocale();
    const ms = useFakeLoadTime(1, 10);
    const [now] = useState(() => new Date());

    const formatted = now.toLocaleString(intlLocale, {
        dateStyle: "full",
        timeStyle: "medium",
    });

    const hour = now.getHours();

    let message: string;
    if (hour < 6) message = t("date.night");
    else if (hour < 12) message = t("date.morning");
    else if (hour < 18) message = t("date.afternoon");
    else message = t("date.evening");

    return (
        <div className="font-mono text-sm">
            <Prompt command="date" />
            <Muted>{t("loadings.date", { ms })}</Muted>

            <Output>
                {formatted}
                <br />
                {message}
            </Output>
        </div>
    );
}

export function NeoFetchMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(50, 300);
    const age = getAge(BIRTH_DATE);

    return (
        <div className="font-mono text-sm">
            <Prompt command="neofetch" />
            <Muted>{t("loadings.neofetch", { ms })}</Muted>

            <div className="mt-2 flex flex-col md:flex-row gap-4">
                <pre className="text-green-500">
                    {`
       /\\
      /  \\       romulo@dev
     /----\\      -------------
    /      \\     OS: HumanOS 1.0
   /  /\\    \\    Host: Rio Grande - RS
  /  /  \\    \\   Kernel: Coffee-driven
 /__/____\\____\\  Uptime: ${t("neofetch.uptime", { age })}
`}
                </pre>

                <div className="text-gray-700 mt-10 dark:text-neutral-300">
                    <p>👨‍💻 {t("neofetch.name")}: Romulo de Moraes</p>
                    <p>🎂 {t("neofetch.age")}: {age}</p>
                    <p>📍 {t("neofetch.location")}: Rio Grande - RS</p>
                    <p>💼 {t("neofetch.stack")}: {t("neofetch.stack-value")}</p>
                    <p>🧠 {t("neofetch.interests")}: {t("neofetch.interests-value")}</p>
                    <p>⚡ {t("neofetch.status")}: {t("neofetch.status-value")}</p>
                </div>
            </div>
        </div>
    );
}

type UptimeState =
    | { status: "loading" }
    | { status: "error" }
    | { status: "ready"; createdAt: number; fetchMs: number };

export function UptimeMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const [state, setState] = useState<UptimeState>({ status: "loading" });
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        let cancelled = false;
        const startedAt = performance.now();

        // The loading line reports the real duration of the GitHub request.
        getRepoCreatedAt()
            .then((date) => {
                if (cancelled) return;
                setNow(Date.now());
                setState({
                    status: "ready",
                    createdAt: date.getTime(),
                    fetchMs: Math.round(performance.now() - startedAt),
                });
            })
            .catch(() => {
                if (!cancelled) setState({ status: "error" });
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (state.status !== "ready") return;

        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [state.status]);

    let body: ReactNode;

    if (state.status === "loading") {
        body = (
            <Muted>
                <Spinner /> {t("uptime.loading")}
            </Muted>
        );
    } else if (state.status === "error") {
        body = <div className="text-red-500">{t("uptime.error")}</div>;
    } else {
        const diff = Math.max(0, Math.floor((now - state.createdAt) / 1000));

        body = (
            <>
                <Muted>{t("loadings.uptime", { ms: state.fetchMs })}</Muted>
                <Output>
                    {t("uptime.value", {
                        days: Math.floor(diff / 86400),
                        hours: Math.floor((diff % 86400) / 3600),
                        minutes: Math.floor((diff % 3600) / 60),
                        seconds: diff % 60,
                    })}
                </Output>
            </>
        );
    }

    return (
        <div className="font-mono text-sm">
            <Prompt command="uptime" />
            {body}
        </div>
    );
}

export function MatrixMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(100, 999);
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const randomLine = Math.random().toString(36).substring(2, 12);
            setLines((prev) => [...prev.slice(-10), randomLine]);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="font-mono text-sm">
            <Prompt command="matrix" />
            <Muted>{t("loadings.matrix", { ms })}</Muted>

            <div className="mt-2 text-green-500">
                {lines.map((line, i) => (
                    <div key={i}>{line}</div>
                ))}
            </div>
        </div>
    );
}

export function HackBankMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const intlLocale = useIntlLocale();
    const ms = useFakeLoadTime(200, 800);
    const [progress, setProgress] = useState(0);
    const [elapsedMs, setElapsedMs] = useState<number | null>(null);

    useEffect(() => {
        const startedAt = performance.now();
        let current = 0;

        const interval = setInterval(() => {
            current = Math.min(100, current + Math.random() * 15);
            setProgress(current);

            if (current >= 100) {
                clearInterval(interval);
                setElapsedMs(performance.now() - startedAt);
            }
        }, 300);

        return () => clearInterval(interval);
    }, []);

    let status: string;
    if (elapsedMs !== null) status = t("hack-bank.done", { seconds: formatSeconds(elapsedMs, intlLocale) });
    else if (progress > 70) status = t("hack-bank.bypassing");
    else if (progress > 40) status = t("hack-bank.injecting");
    else if (progress > 10) status = t("hack-bank.accessing");
    else status = t("hack-bank.initializing");

    return (
        <div className="font-mono text-sm">
            <Prompt command="hack bank" />
            <Muted>{t("loadings.hack-bank", { ms })}</Muted>

            <Output>
                {status}
                <div className="w-full bg-gray-700 h-2 mt-2 rounded">
                    <div
                        className="bg-green-500 h-2 rounded"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="mt-1">{Math.floor(progress)}%</p>
                {elapsedMs !== null ? <Muted>{t("hack-bank.disclaimer")}</Muted> : null}
            </Output>
        </div>
    );
}

export function CoffeeMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const intlLocale = useIntlLocale();
    const waterMs = useFakeLoadTime(400, 999);
    // Real brewing delay; the final line reports this same value in seconds.
    const brewMs = useFakeLoadTime(2500, 5000);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setReady(true), brewMs);
        return () => clearTimeout(timeout);
    }, [brewMs]);

    return (
        <div className="font-mono text-sm">
            <Prompt command="coffee" />
            <Muted>{t("loadings.coffee", { ms: waterMs })}</Muted>

            {ready ? (
                <>
                    <Muted>{t("coffee.done", { seconds: formatSeconds(brewMs, intlLocale) })}</Muted>
                    <Output>{t("coffee.ready")}</Output>
                </>
            ) : (
                <Output>
                    <Spinner /> {t("coffee.brewing")}...
                </Output>
            )}
        </div>
    );
}

export function JokeMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(1, 50);
    const jokes = t.raw("joke.items") as string[];
    const [index] = useState(() => Math.floor(Math.random() * jokes.length));

    return (
        <div className="font-mono text-sm">
            <Prompt command="joke" />
            <Muted>{t("loadings.joke", { ms })}</Muted>

            <Output>{jokes[index]}</Output>
        </div>
    );
}
