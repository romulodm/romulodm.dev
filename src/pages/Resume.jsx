import './styles.css'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DownloadOutlined, ExpandLess, ExpandMore, SchoolOutlined, Translate } from '@mui/icons-material'
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';

import Initial from '../components/infos/Initial'
import Experience from '../components/infos/Experience'
import Education from '../components/infos/Education'
import Languages from '../components/infos/Languages'
import Title from '../components/Title';

export default function Resume() {
    const { t } = useTranslation('resume');

    const [showExperience, setShowExperience] = useState(true);
    const [showEducation, setShowEducation] = useState(true);
    const [showLanguages, setShowLanguages] = useState(true);
    const [showDownload, setShowDownload] = useState(false);

    return (
        <>
        <Title text={t('page-title')} />

        <div className="flex flex-col w-full  py-3 sm:mt-10 lg:mt-4 items-center justify-center h-full">
            <div className="responsive-content">
                <Initial/>
                
                <div className="flex flex-col items-center w-full pb-2">
                    <div className="flex flex-row justify-between w-full">
                        <div className="flex flex-row items-center gap-1.5">
                            <div className="flex bg-gray-200 justify-center w-5 h-5 items-center rounded-md p-4">
                                <WorkOutlineOutlinedIcon style={{fontSize: '.85rem'}} className="text-center text-gray-900"/>
                            </div>

                            <p className='font-bold'>Experiências</p>
                        </div>

                        <button
                            onClick={() => setShowExperience(!showExperience)} 
                            className="flex bg-gray-200 hover:bg-gray-300 items-center justify-center w-5 h-5 rounded-lg p-4"
                        >
                            {showExperience ? (
                                <ExpandMore style={{fontSize: '1rem'}}/>
                            ) : (
                                <ExpandLess style={{fontSize: '1rem'}}/>
                            )}
                        </button>
                    </div>
                    <div className="w-full mt-2 h-[1px] bg-gray-200"/>
                </div>
                
                {showExperience && <Experience/>}
                
                <div className="flex flex-col mt-4 items-center w-full py-2">
                    <div className="flex flex-row justify-between w-full">
                        <div className="flex flex-row items-center gap-1.5">
                            <div className="flex bg-gray-200 justify-center w-5 h-5 items-center rounded-md p-4">
                                <SchoolOutlined style={{fontSize: '1rem'}} className="text-gray-900"/>
                            </div>
                            <p className='font-bold'>Educação</p>
                        </div>

                        <button 
                            onClick={() => setShowEducation(!showEducation)}
                            className="flex bg-gray-200 hover:bg-gray-300 items-center justify-center w-5 h-5 rounded-lg p-4"
                        >
                            {showEducation ? (
                                <ExpandMore style={{fontSize: '1rem'}}/>
                            ) : (
                                <ExpandLess style={{fontSize: '1rem'}}/>
                            )}
                        </button>
                    </div>
                    <div className="w-full mt-2 h-[1px] bg-gray-200"/>
                </div>

                {showEducation && <Education/>}

                <div className="flex flex-col mt-4 items-center w-full py-2">
                    <div className="flex flex-row justify-between w-full">
                        <div className="flex flex-row items-center gap-1.5">
                            <div className="flex bg-gray-200 justify-center w-5 h-5 items-center rounded-md p-4">
                                <Translate style={{fontSize: '.85rem'}} className="text-gray-900"/>
                            </div>
                            <p className='font-bold'>Idiomas</p>
                        </div>

                        <button 
                            onClick={() => setShowLanguages(!showLanguages)}
                            className="flex bg-gray-200 hover:bg-gray-300 items-center justify-center w-5 h-5 rounded-lg p-4"
                        >
                            {showLanguages ? (
                                <ExpandMore style={{fontSize: '1rem'}}/>
                            ) : (
                                <ExpandLess style={{fontSize: '1rem'}}/>
                            )}
                        </button>
                    </div>
                    <div className="w-full mt-2 h-[1px] bg-gray-200"/>
                </div>

                {showLanguages && <Languages/>}

            </div>
        </div>
    </>
    );
}
