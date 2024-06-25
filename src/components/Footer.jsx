import { useTranslation } from 'react-i18next';

export default function Footer() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col w-full">

            <div className="flex w-full justify-center">
                <div className="text-center w-20 emoji-home">👋</div>
            </div>
            
            <footer className="text-gray-400 text-center text-sm py-2 px-10">
                Romulo de Moraes 2024 © Made with ❤️ and so much ☕ 
            </footer> 

        </div>
    )
}
