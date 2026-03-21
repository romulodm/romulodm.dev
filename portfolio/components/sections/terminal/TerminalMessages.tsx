"use client";

import React from "react";
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
        "- follow": t("commands.follow"),
        "- who": t("commands.who"),
        "- whoami": t("commands.whoam"),
        "- cats": t("commands.cats"),
        "- inter": t("commands.inter"),
        "- spotify": t("commands.spotify"),
        "- secret": t("commands.secret"),
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

export function UnknowMessage({ command }: CommandMessageProps): JSX.Element {
    const t = useTranslations('terminal');

    return (
        <div className="font-mono text-sm">
            <div className="flex flex-row gap-1">
                <Visitor />
                <div className="whitespace-nowrap font-bold dark:text-white/80">{command}</div>
            </div>
            <div className="flex flex-row text-gray-500 dark:text-neutral-400/90 gap-1">
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
                <div className="flex flex-row gap-1">
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
                <div className="flex flex-row gap-1">
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
                <div className="flex flex-row text-gray-500 dark:text-neutral-400/90 gap-1">
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
                <div className="flex flex-row gap-1">
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

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`who`}</div>

                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loadings.who')} 20 {t('loadings.who-years')}.
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
                <div className="flex flex-row gap-1">
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
                <div className="flex flex-row gap-1">
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
                <div className="flex flex-row gap-1">
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
                <div className="flex flex-row gap-1">
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
                <div className="flex flex-row gap-1">
                    <Visitor />
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`secret`}</div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loadings.secret')} 666 ms.
                </div>
                <div className="flex flex-col text-gray-500 dark:text-neutral-400/90">
                    <p className="flex flex-row gap-1">
                        {t('secret.how-fisrt')}
                        <p className="strong font-bold text-red-500">secret --pass '{t('secret.how-try')}'</p>
                        {t('secret.how-second')}
                    </p>

                    <p className="flex flex-row gap-1">{t('secret.how-hint')}<p className="strong font-bold text-red-500">'secret --get_hint'</p>.</p>
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
                <div className="flex flex-row gap-1">
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
                <div className="flex flex-row gap-1">
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
                <div className="flex flex-row gap-1">
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
