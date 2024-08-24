import { useTranslation } from "react-i18next";

const locales = {
    "pt-BR": { title: "PT", iconPath: "./br.svg"},
    "en-US": { title: "EN", iconPath: "./us.svg"}
}

export default function LanguageSelector({showTitle}) {
    const { i18n } = useTranslation();
    const actualLanguage = i18n.language;
    const otherLanguage = actualLanguage === 'pt-BR' ? 'en-US' : 'pt-BR';

    const changeSystemsLanguage = () => {
        i18n.changeLanguage(otherLanguage);
    };

    return (
        <button className="flex flex-col items-center gap-1" onClick={changeSystemsLanguage}  >
            <img className="w-5 h-5 rounded-full object-cover" src={locales[actualLanguage].iconPath} alt={locales[actualLanguage].title} />
            {showTitle && (
                <div className="text-xs dark:text-white">{locales[actualLanguage].title}</div>
            )}
        </button>        
    );
}
