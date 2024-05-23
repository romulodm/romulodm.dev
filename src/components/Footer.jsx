import { useTranslation } from 'react-i18next';

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="text-gray-400 text-center text-sm py-2 px-10">
            Romulo de Moraes 2024 © Made with ❤️ and so much ☕ 
        </footer> 
    )
}
