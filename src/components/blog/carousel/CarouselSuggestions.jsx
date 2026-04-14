import { useTranslation } from 'react-i18next';
import { FaRegLightbulb } from "react-icons/fa6";
import { GrInfo } from "react-icons/gr";
import { LuHeartHandshake } from "react-icons/lu";

export default function CarouselSuggestions() {
    const { t } = useTranslation('blog');

    return (
        <section className="h-full">   
            <div className="h-full relative overflow-hidden px-2 py-8 md:px-16 md:py-12" data-aos="zoom-y-out">

            <div className="absolute right-0 bottom-0 pointer-events-none hidden lg:block" aria-hidden="true">
                    <svg width="440" height="250" xmlns="http://www.w3.org/2000/svg">
                        <g fill="#FFF">
                            <ellipse fillOpacity=".12" cx="32" cy="75" rx="8" ry="8" />
                            <ellipse fillOpacity=".4" cx="32" cy="75" rx="1" ry="1" />
                            <ellipse fillOpacity=".6" cx="80" cy="150" rx="2" ry="2" />
                            <ellipse fillOpacity=".24" cx="120" cy="68" rx="24" ry="24" />
                            <ellipse fillOpacity=".4" cx="120" cy="68" rx="3" ry="3" />
                            <ellipse fillOpacity=".12" cx="150" cy="200" rx="28" ry="28" />
                            <ellipse fillOpacity=".1" cx="200" cy="110" rx="2" ry="2" />
                            <foreignObject x="142.3" y="193" width="24" height="24">
                                <GrInfo size={16} className="text-white/50"/>
                            </foreignObject>
                            <foreignObject x="258" y="95" width="24" height="24">
                                <LuHeartHandshake size={24} className="text-white/60"/>
                            </foreignObject>
                            <ellipse fillOpacity=".2" cx="245" cy="190" rx="8" ry="8" />
                            <ellipse fillOpacity=".6" cx="245" cy="190" rx="2" ry="2" />
                            <ellipse fillOpacity=".2" cx="270" cy="105" rx="38" ry="38" />
                            <ellipse fillOpacity=".5" cx="330" cy="220" rx="3" ry="3" />
                            <ellipse fillOpacity=".7" cx="330" cy="130" rx="6" ry="6" />
                            <ellipse fillOpacity=".65" cx="400" cy="71" rx="3" ry="3" />
                            <ellipse fillOpacity=".65" cx="425" cy="185" rx="3" ry="3" />
                        </g>
                    </svg>
                </div>

                <div className="relative flex flex-col lg:flex-row justify-between items-center">
                
                <div className="text-center lg:text-left lg:max-w-xl">
                    <h3 className="text-lg sm:text-2xl font-bold text-white mb-1">{t('suggestions.title')} 🫰</h3>
                    <div className="flex flex-col sm:flex-row gap-1 justify-center sm:justify-start lg:flex-row">
                        <p className="text-sm sm:text-md text-gray-300 text-md sm:mb-2 gap-1">{t('suggestions.content')}</p>
                        <button 
                            className="text-sm sm:text-md flex underline text-white text-center justify-center mb-3 sm:mb-0"
                        >
                            {t('suggestions.privacy')}
                            .
                        </button>
                    </div>
                    
                    <form className="w-full lg:w-auto">
                        <div className="flex flex-row justify-left gap-3">
                            
                            <button
                                type="submit"
                                className="flex items-center w-full lg:w-fit justify-center gap-2 rounded-md bg-gray-200 px-3.5 py-2.5 text-sm font-semibold text-blue-950 hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                            >
                                <FaRegLightbulb/>
                                {t('suggestions.btn')}
                            </button>
                        </div>
                    </form>
                </div>
                </div>
            </div>
        </section>
    );
}