import { useState } from'react';
import { useTranslation } from'react-i18next';
import { IoClose } from'react-icons/io5';
    

export default function Announcement(){
    const { t } = useTranslation('announcement');
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="bg-sky-500 dark:bg-[#2f3031] mt-0 lg:mb-[-20px] lg:mt-10 md:mt-14 text-white flex items-center justify-center h- relative">
            <p className="uppercase text-xs tracking-widest text-center px-4 py-3">
                {t('content')}
            </p>

            <button 
                onClick={() => setIsVisible(false)} 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-lg"
            >
                <IoClose />
            </button>
        </div>
    );
}
