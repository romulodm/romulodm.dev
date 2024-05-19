const availableCommands = {
    "- help": "List of commands",
    "- clear": "Clear terminal",
    "- initial": "Display the header",
    "- follow": "My social networks",
    "- who": "Who is Romulo?",
    "- whoami": "Who is you?",
    "- cats": "Wonderful cat art",
    "- inter": "The biggest football club in the world",
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
