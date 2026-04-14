import './styles.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    DownloadOutlined,
    ExpandLess,
    ExpandMore,
    SchoolOutlined,
    Translate,
} from '@mui/icons-material';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';

import Initial from '../components/infos/Initial';
import Experience from '../components/infos/Experience';
import Education from '../components/infos/Education';
import Languages from '../components/infos/Languages';
import Title from '../components/Title';
import Footer from '../components/Footer';

export default function Resume() {
    const { t } = useTranslation('resume');

    const [showExperience, setShowExperience] = useState(true);
    const [showEducation, setShowEducation] = useState(true);
    const [showLanguages, setShowLanguages] = useState(true);

    return (
        <>
            <Title text={t('page-title')} />

            <div className="flex flex-col min-h-screen">
                <div className="flex-grow">
                    <div className="flex flex-col w-full mt-3 md:mt-16 py-0 lg:mt-10 items-center justify-center">
                        <div className="responsive-content">
                            <Initial />

                            {/* Experiências */}
                            <div className="flex flex-col items-center w-full pb-2">
                                <div className="flex flex-row justify-between w-full">
                                    <div className="flex flex-row items-center gap-1.5">
                                        <div className="flex bg-gray-200 dark:bg-[#2f3031] text-dark dark:text-white justify-center w-5 h-5 items-center rounded-md p-4">
                                            <WorkOutlineOutlinedIcon style={{ fontSize: '.85rem' }} className="text-center" />
                                        </div>

                                        <p className="font-bold dark:text-neutral-300">{t('titles.xp')}</p>
                                    </div>
                                    
                                    <button
                                        onClick={() => setShowExperience(!showExperience)}
                                        className="flex bg-gray-200 hover:bg-gray-300 dark:bg-[#2f3031] dark:hover:bg-neutral-700 text-dark dark:text-white items-center justify-center w-5 h-5 rounded-lg p-4"
                                    >
                                        {showExperience ? (
                                            <ExpandMore style={{ fontSize: '1rem' }} />
                                        ) : (
                                            <ExpandLess style={{ fontSize: '1rem' }} />
                                        )}
                                    </button>
                                    
                                </div>
                                <div className="w-full mt-2 h-[1px] bg-gray-200 dark:bg-neutral-700" />
                            </div>

                            {showExperience && <Experience />}

                            {/* Educação */}
                            <div className="flex flex-col mt-4 items-center w-full py-2">
                                <div className="flex flex-row justify-between w-full">
                                    <div className="flex flex-row items-center gap-1.5">
                                        <div className="flex bg-gray-200 dark:bg-[#2f3031] text-dark dark:text-white justify-center w-5 h-5 items-center rounded-md p-4">
                                            <SchoolOutlined style={{ fontSize: '1rem' }} className="text-center" />
                                        </div>
                                        <p className="font-bold dark:text-neutral-300">{t('titles.education')}</p>
                                    </div>
  
                                    <button
                                        onClick={() => setShowEducation(!showEducation)}
                                        className="flex bg-gray-200 hover:bg-gray-300 dark:bg-[#2f3031] dark:hover:bg-neutral-700 text-dark dark:text-white items-center justify-center w-5 h-5 rounded-lg p-4"
                                    >
                                        {showEducation ? (
                                            <ExpandMore style={{ fontSize: '1rem' }} />
                                        ) : (
                                            <ExpandLess style={{ fontSize: '1rem' }} />
                                        )}
                                    </button>
                                   
                                </div>
                                <div className="w-full mt-2 h-[1px] bg-gray-200 dark:bg-neutral-700" />
                            </div>

                            {showEducation && <Education />}

                            {/* Idiomas */}
                            <div className="flex flex-col mt-4 items-center w-full py-2">
                                <div className="flex flex-row justify-between w-full">
                                    <div className="flex flex-row items-center gap-1.5">
                                        <div className="flex bg-gray-200 dark:bg-[#2f3031] text-dark dark:text-white justify-center w-5 h-5 items-center rounded-md p-4">
                                            <Translate style={{ fontSize: '.85rem' }} className="text-center" />
                                        </div>
                                        <p className="font-bold dark:text-neutral-300">{t('titles.lang')}</p>
                                    </div>
          
                                    <button
                                        onClick={() => setShowLanguages(!showLanguages)}
                                        className="flex bg-gray-200 hover:bg-gray-300 dark:bg-[#2f3031] dark:hover:bg-neutral-700 text-dark dark:text-white items-center justify-center w-5 h-5 rounded-lg p-4"
                                    >
                                        {showLanguages ? (
                                            <ExpandMore style={{ fontSize: '1rem' }} />
                                        ) : (
                                            <ExpandLess style={{ fontSize: '1rem' }} />
                                        )}
                                    </button>
                                    
                                </div>
                                
                                {showLanguages && (
                                    <div className="w-full mt-2 h-[1px] bg-gray-200 dark:bg-neutral-700" />
                                )}
                            </div>

                            {showLanguages && <Languages />}
                            
                            <Footer showHand={false} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
