import getInformation from "../../utils/getInformation";

const colorMain = (level) => {
    switch (level) {
        case 'A1':
        case 'A2':
            return 'text-gray-600 border-gray-500';
        case 'B1':
            return 'text-blue-400 border-blue-500';
        case 'B2':
        case 'C1':
            return 'text-green-600 border-green-500';
        case 'C2':
            return 'text-green-600 border-green-500';

    }
};

const colorLevel = (level) => {
    switch (level) {
        case 'A1':
        case 'A2':
            return 'bg-gray-50 text-gray-600 border-gray-500';
        case 'B1':
            return 'bg-blue-500 text-blue-100 border-blue-300';
        case 'B2':
        case 'C1':
            return 'bg-green-500 text-green-600 border-green-500';
        case 'C2':
            return 'bg-green-500 text-green-100 border-green-300';

    }
};

export default function Languages() {
    const personalInformations = getInformation();

    return (
        <div className="flex flex-wrap gap-2.5 pt-1 mb-3">
            {personalInformations.languages.map((language) => (
                <div key={language.name} className={`flex items-center gap-2 border rounded-lg p-2 font-bold text-sm ${colorMain(language.level)}`}>
                    <div className={`flex items-center justify-center p-2 rounded-lg text-white text-xs font-semibold ${colorLevel(language.level)}`}>
                        {language.level}
                    </div>
                    <div>
                        {`${language.name}${language.native ? ' (native)' : ''}`}
                    </div>
                </div>
            ))}
        </div>
    );
}
