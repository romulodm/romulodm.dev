import { useState } from "react";
import { useTranslation } from "react-i18next";

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';

export default function LanguageSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const { i18n } = useTranslation();

    const actualLanguage = i18n.language;
    const otherLanguage = actualLanguage === 'pt-BR' ? 'en-US' : 'pt-BR';

    const changeSystemsLanguage = () => {
        i18n.changeLanguage(otherLanguage);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    onClick={changeSystemsLanguage}           
                >
                    <LanguageOutlinedIcon />
                </button>
            </div>
        </div>
    );
}
