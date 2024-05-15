import { useTranslation } from "react-i18next"
import WelcomeAnimation from "../components/WelcomeAnimation";

export default function Home() {
    const { t } = useTranslation();
    
    return (
        <WelcomeAnimation/>
    )
}