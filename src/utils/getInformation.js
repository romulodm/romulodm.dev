import { useTranslation } from "react-i18next";

import { PT_INFOS } from '../content/resume/pt-br';
import { EN_INFOS } from '../content/resume/en-us';

export default function getInformation() {
    const { i18n } = useTranslation();
    const actualLanguage = i18n.language;

    if (actualLanguage == "pt-BR") {
        return PT_INFOS
    } else {
        return EN_INFOS
    }
}