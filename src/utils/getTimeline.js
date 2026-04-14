import { useTranslation } from "react-i18next";

import { PT_TIMELINE } from "../content/timeline/pt-br";
import { EN_TIMELINE } from "../content/timeline/en-us";

export default function getTimeline() {
    const { i18n } = useTranslation();
    const actualLanguage = i18n.language;

    if (actualLanguage == "pt-BR") {
        return PT_TIMELINE
    } else {
        return EN_TIMELINE
    }
}