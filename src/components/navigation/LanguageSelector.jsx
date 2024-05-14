import { useState } from "react";
import { useTranslation } from "react-i18next";

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const locales = {
    "pt-BR": { title: "PT-BR", iconPath: "./br.svg"},
    "en-US": { title: "EN-US", iconPath: "./us.svg"}
}

export default function LanguageSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const { i18n } = useTranslation();

    const actualLanguage = i18n.language;

    const changeSystemsLanguage = (newLanguage) => {
        i18n.changeLanguage(newLanguage);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-md bg-gray-700 p-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-600"
                    id="menu-button"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <img className="w-5 h-5 mr-1.5" src={locales[actualLanguage].iconPath} alt={locales[actualLanguage].title} />
                    <p>{locales[actualLanguage].title}</p>
                    {isOpen ? (<ExpandLessIcon/>) : (<ExpandMoreIcon/>)}
                </button>
            </div>

            {isOpen && (
                <div className="absolute mt-1 w-full">
                    {Object.entries(locales).map(([key, item], index) => (
                        key !== actualLanguage && (
                            <div key={index}>
                                <button
                                    type="button"
                                    className="inline-flex w-full items-center justify-left rounded-md bg-white p-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-200"
                                    id="menu-button"
                                    aria-expanded={isOpen}
                                    aria-haspopup="true"
                                    onClick={() => changeSystemsLanguage(key)}
                                >
                                    <img className="w-5 h-5 mr-1.5" src={item.iconPath} alt={item.title} />
                                    <p>{item.title}</p>
                                </button>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}
