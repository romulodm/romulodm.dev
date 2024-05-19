export function DefaultMessage() {
    return(
        <div className="font-mono text-sm">
            <div className="text-gray-500">
                    Powershell 3.9.22
            </div>
        </div>
    )
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

export function CatMessage() {
    return (
        <div>
            <div className="font-mono text-sm">
                <div className="flex flex-row gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`follow`}</div>
                </div>
                <div className="text-gray-500">
                    Loading follow message took 164 ms.
                </div>
            </div>
            <pre>
                {`                   
 /\\     /\\
{  \`---'  }
{  O   O  }  meow?
~~>  V  <~~ 
 \\  ~|~  /
  \`-----'____
 /     \\    \\_
{       }\\  )_\\_   _
|  \\_/  |/ /  \\_\\_/ )
 \\__/  /(_/     \\__/
   (__/
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
                    Loading follow message took 1909 ms.
                </div>
            </div>
            <pre className="bg-red-600 text-white">
                {`                   
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠤⠔⠒⣬⠉⠉⣍⡍⠁⢒⠢⠤⣀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⢔⢍⠀⠸⠤⣀⠡⢥⣤⣥⡥⠄⣁⡃⠠⠒⠉⠢⢄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⢊⣠⡀⢈⢤⣢⣵⣾⣿⠟⠛⠛⠟⢿⣿⣾⣵⡢⡀⠎⢀⣑⢄⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡔⢅⡀⢁⢔⣵⣿⣿⣿⣿⠿⢶⠀⠀⢰⠳⢿⣿⣿⣿⣷⣕⡐⠘⠈⢢
⠀⠀⠀⠀⠀⠀⠀⠀⠀⡜⠀⠀⠠⣳⣿⣿⣿⣿⠏⠀⣠⣼⠀⠀⢸⣤⠀⠉⢻⣿⣿⣿⣮⢆⢺⠧⢣
⠀⠀⠀⠀⠀⠀⠀⠀⢰⠙⠤⢢⣳⣿⣿⣿⣿⠟⠀⠀⣀⣀⠀⠀⢀⣀⠂⠠⠙⠁⢹⣿⣿⣯⠆⢄⢀⡆
⠀⠀⠀⠀⠀⠀⠀⠀⡆⠀⠀⡌⣿⣿⣿⠟⠁⢸⡀⠀⠈⢻⠀⠀⢸⣧⣀⣿⣶⣄⢸⣿⣿⣿⣼⠈⠁⢰
⠀⠀⠀⠀⠀⠀⠀⠀⡇⠚⠃⣿⣿⣟⠁⠀⠀⢾⣿⣦⣀⣸⠀⠀⢸⠉⠙⠻⣿⣿⣿⣿⣿⣿⣿⠘⠉⢸
⠀⠀⠀⠀⠀⠀⠀⠀⠇⠀⠀⢃⣿⣿⣷⣄⠀⠈⡟⠉⠙⣿⠀⠀⢸⣄⡀⠀⠈⠿⠻⣿⣿⣿⢻⠀⠀⢸
⠀⠀⠀⠀⠀⠀⠀⠀⠸⡀⠀⠘⡽⣿⣿⣿⡷⠜⠀⠀⡰⠛⠒⠒⠚⠛⢱⠀⠀⢸⣾⣿⣿⣟⠆⠀⠀⠇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢣⠀⠀⠘⡽⣿⣿⣦⣤⡀⠈⠓⠶⠒⠒⢲⠶⠋⠀⣠⣿⣿⣿⢟⠎⠀⠀⡜⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠣⡀⠀⠈⠪⡻⣿⣿⣿⣷⣦⣤⠀⠀⢸⣤⣴⣾⣿⣿⣿⠋⠁⠀⢀⠜⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠑⢄⠀⠀⠈⠚⠝⡻⢿⣿⣤⣤⣠⣤⣴⡿⢿⡻⠑⠁⠀⠀⡠⠊⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠑⠢⣀⠀⠀⠀⡍⠐⢚⡛⢛⣓⠂⡭⡄⠀⠀⣀⠔⠊⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠒⠨⠥⢀⣈⣃⣈⣚⣀⠤⠅⠒⠉⠀⠀ 
                `}
            </pre>
        </div>
    );
}


export function HelpMessage() {
    return(
        <div>Hello!</div>
    )
}

export function UnknowMessage() {
    return(
        <div>Hello!</div>
    )
}