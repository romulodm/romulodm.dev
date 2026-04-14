import { useTranslation } from "react-i18next";

export default function greetingMessage() {
    const { t } = useTranslation('hero');

    const date = new Date();
    const hours = date.getHours();
    let content = '';
    if (hours < 3) {
      content = t('greeting-4');
    } else if (hours < 12) {
      content = t('greeting-1');
    } else if (hours < 18) {
      content = t('greeting-2');
    } else {
      content = t('greeting-4');
    }
    return content;
  }