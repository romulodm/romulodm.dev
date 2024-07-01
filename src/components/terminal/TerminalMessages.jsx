const availableCommands = {
    "- help": "List of commands",
    "- clear": "Clear terminal",
    "- initial": "Display the header",
    "- follow": "My social networks",
    "- who": "Who is Romulo?",
    "- whoami": "Who is you?",
    "- cats": "Wonderful cat art",
    "- inter": "The biggest football club in the world",
    "- spotify": "One of my playlists",
    "- secret": "Simple puzzle, what are the password?",
};

export function DefaultMessage() {
    return(
        <div className="font-mono text-sm">
            <div className="text-gray-500">
                    Powershell 3.9.22
            </div>
        </div>
    )
}

export function UnknowMessage({ command }) {
    return (
        <div className="font-mono text-sm">
            <div className="flex flex-row gap-1">
                <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                <div className="whitespace-nowrap font-bold">{command}</div>
            </div>
            <div className="flex flex-row text-gray-500 gap-1">
                <p>Command not found, type</p> <p className="strong font-bold text-red-500">'help'</p> for a list of commands.
            </div>
        </div>
    );
}

export function HelpMessage() {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`help`}</div>
                </div>
                <div className="text-gray-500">
                    Loading help message took 20 ms.
                </div>
                <div className="flex px-2 py-3">
                    <div className="w-32 pr-1">
                        {Object.keys(availableCommands).map((command, index) => (
                            <p className="font-semibold text-red-500" key={index}>{command}</p>
                        ))}
                    </div>
                    <div>
                        {Object.values(availableCommands).map((description, index) => (
                            <p className="text-gray-500" key={index}>{description}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function InitialMessage() {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`inital`}</div>

                </div>
                <div className="text-gray-500">
                    Loading follow message took 29 ms.
                </div>
            </div>
            <pre className="text-gray-600">
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
                <div className="flex flex-row text-gray-500 gap-1">
                    <p>For a list of available commands, type</p> <p className="strong font-bold text-red-500">'help'</p>.
                </div>
            </div>
        </div>
    );
}

export function FollowMessage() {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`follow`}</div>

                </div>
                <div className="text-gray-500">
                    Loading socials message took 1337 ms.
                </div>

                <div className="flex ml-5 flex-col text-purple-400 underline">
                    <a target="_blank" href="https://github.com/romulodm">- GitHub</a>
                    <a target="_blank" href="https://www.linkedin.com/in/romulo-de-moraes-918793258/">- LinkedIn</a>
                    <a target="_blank" href="https://steamcommunity.com/id/rdmzao/">- Steam</a>
                    <a target="_blank" href="https://www.instagram.com/romulo_dmr/">- Instagram</a>
                </div>
                
                </div>
        </div>
    );
}

export function WhoMessage() {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`who`}</div>

                </div>
                <div className="text-gray-500">
                    Loading this useless infos took 20 years.
                </div>
                <div className="text-gray-500 flex flex-row">
                So... <br/>
                I'm 20 years old, a mere student and technology enthusiast who likes 
                to play games, read books and do some other nerdy things. 🤓
                </div>
            </div>
        </div>
    );
}

export function WhoamiMessage() {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`whoami`}</div>

                </div>
                <div className="text-gray-500">
                    Loading this pill took 2 ms.
                </div>

                <div className="text-gray-500 flex flex-row">
                <br/>
                “Life is not a mystery to be solved, but an experience to be lived.” 
                <br/><br/>
                I saw this phrase in the movie Dune and I thought about it a lot. 
                I believe that we often <br/> make our insignificance a form of martyrdom and doubt,
                when in fact things should be <br/>simpler than they really are.
                <br/><br/>
                You and I are not mere candidates for a place in heaven. If you always live thinking <br/> about
                a future reward, you end up forgetting to live for today and forget who you are.
                <br/><br/>
                According to Jean-Paul Sartre, an existence precedes an essence. This means that<br/> 
                human beings do not have a predetermined nature. You create your own nature through<br/> your 
                actions and choices. Therefore, this question does not have a correct answer. The <br/>responsibilities
                you assume and the choices you make throughout your life determine <br/>who you are.
                <br/><br/>
                Today you can be a programmer, a student, a professional... However, tomorrow you <br/>could be a 
                totally different person, it all depends on you.       
                </div>
            </div>
        </div>
    );
}

export function CatsMessage() {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`cats`}</div>
                </div>
                <div className="text-gray-500">
                    Loading follow message took 164 ms.
                </div>
            </div>
            <pre>
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

export function InterMessage() {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`inter`}</div>
                </div>
                <div className="text-gray-500">
                    Loading SC Iternacional logo took 1909 ms.
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

export function SpotifyMessage() {
    const iframeStyle = {
        borderRadius: '0px'
    };

    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`spotify`}</div>
                </div>
                <div className="text-gray-500">
                    Loading this amazing playlist took 1337 ms.
                </div>
                
            </div>
            <div className="py-2 font-mono text-sm">
                <iframe 
                    style={iframeStyle} 
                    src="https://open.spotify.com/embed/playlist/4Z93kTEkoajtrtsSs9z5W2?utm_source=generator&theme=0"
                    width="90%" height="152" 
                    allowfullscreen="" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy">
                </iframe>
                <div className="text-gray-500 pt-2">
                    Be careful with the volume too high and enjoy in moderation!
                </div>
            </div>

        </div>
    );
}


export function SecretMessage() {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`secret`}</div>
                </div>
                <div className="text-gray-500">
                    Loading this puzzle took 666 ms.
                </div>
                <div className="flex flex-col text-gray-500 ">
                <p className="flex flex-row gap-1">
                    To see the mysterious message you need to type 
                    <p className="strong font-bold text-red-500">secret --pass 'your try'</p>
                    , with your try being a four-digit number.
                </p>

                <p className="flex flex-row gap-1">To see a hint type <p className="strong font-bold text-red-500">'secret --get_hint'</p>.</p>
                </div>
            </div>
            
        </div>
    );
}

export function SecretHintMessage() {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`secret --get_hint`}</div>
                </div>
                <div className="text-gray-500">
                    Come on man, these messages don't take time to get across...
                </div>
                <div className="text-gray-500">
                    The hint is: it's a year 🤯 wow, awesome hint! One more, this year appears in a message here at the terminal...                
                </div>
            </div>
            
        </div>
    );
}

export function SecretWrongMessage({ command }) {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{command}</div>
                </div>
                <div className="text-gray-500">
                    This check it didn't take any time.
                </div>
            </div>
            
        </div>
    );
}

export function SecretCorrectMessage({ command }) {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{command}</div>
                </div>
                <div className="text-gray-500">
                    Correct! Your reward here: <a className="text-purple-400 underline" target="_blank" href={import.meta.env.VITE_TERMINAL_SECRET_REWARD}>reward</a>
                </div>
            </div>
            
        </div>
    );
}