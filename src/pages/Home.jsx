import './styles.css'
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

import { FiAtSign, FiCode, FiUser } from "react-icons/fi";
import { GoCodeOfConduct } from 'react-icons/go';
import { FaArrowRightLong } from 'react-icons/fa6';

import Title from "../components/Title";
import Hero from "../components/sections/Hero";
import Vision from "../components/sections/vision/Vision"
import Terminal from '../components/terminal/Terminal';
import Timeline from '../components/timeline/Timeline';
import Projects from '../components/sections/Projects';
import Contact from '../components/sections/Contact';
import Footer from '../components/Footer';
import TerminalExperience from '../components/terminal/TerminalExperience';

export default function Home() {
    const { t } = useTranslation('home');

    return (
    <>
        <Title text={t('page-title')} />

        <div className="flex flex-col w-full items-center justify-center h-full">
            <div className="responsive-content">
                {/*Título inicial*/}
                <div className="flex flex-col justify-center w-full">
                    <Hero/>
                </div>

                {/*Resumo*/}
                <div className="flex flex-col justify-center w-full mb-4">
                    <div className="flex flex-row justify-center w-full py-2">
                        <div className="flex flex-col items-center justify-center">
                            <div id="resume-line" className="h-24 w-0.5" />
                            <div id="resume-icon" className="flex items-center p-3 border-0 rounded-full text-blue-700 dark:text-white">
                                <FiUser />
                            </div>
                            <div className="flex flex-row items-center text-3xl font-bold gap-1 mt-4">
                                <p className="text-gray-900 dark:text-neutral-400">{t('profile.title')}</p>
                                <p id="resume-title" className='text-blue-700'>{t('profile.title-colored')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="hidden sm:block mt-4">
                        <Terminal />
                    </div>

                    <div className="block sm:hidden">
                        <TerminalExperience />
                    </div>

                    <Timeline />

                    <hr className="mt-3 mb-5 dark:border-[#2f3031]"/>

                    <div className="flex items-center justify-between w-full py-4 px-2 sm:py-8 sm:px-6 bg-gray-200 dark:bg-neutral-800 border rounded-lg dark:border-neutral-700 flex-col sm:flex-row text-center sm:text-left items-center">
                        <div className="mb-2 sm:mb-0">
                            <p className="text-slate-700 dark:text-neutral-300 font-bold mb-1 text-lg sm:text-2xl">{t('profile.link-title')} 📋</p>
                            <p className="text-slate-500 dark:text-neutral-400 text-sm sm:text-lg">{t('profile.link-content')}</p>
                        </div>
                        <NavLink to="/resume">
                            <button className="flex px-5 min-w-44 text-sm md:text-md justify-center w-full font-semibold items-center gap-2 p-3 bg-blue-600 dark:bg-blue-600/50 hover:bg-blue-700 dark:hover:bg-blue-700/50 rounded-lg text-white">
                                {t('profile.link-button')}
                                <FaArrowRightLong/>
                            </button>
                        </NavLink>
                    </div>

                </div>

                {/*Projetos*/}
                <div className="flex flex-col justify-center w-full">
                    <div className="flex flex-row justify-center w-full">
                        <div className="flex flex-row justify-center w-full py-2">
                            <div className="flex flex-col items-center justify-center">
                                <div id="projects-line" className="h-24 w-0.5" />
                                <div id="projects-icon" className="flex items-center p-3 border-0 rounded-full text-purple-800 dark:text-white">
                                    <FiCode />
                                </div>
                                <div className="flex flex-row items-center text-3xl font-bold gap-1 mt-4">
                                    <p className="text-gray-900 dark:text-neutral-400">{t('projects.title')}</p>
                                    <p id="resume-title" className='text-purple-800'>{t('projects.title-colored')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Projects/>

                    <hr className="mt-6 mb-5 dark:border-[#2f3031]"/>

                    <div className="flex items-center justify-between w-full py-4 px-2 sm:py-8 sm:px-6 bg-gray-200 dark:bg-neutral-800 border rounded-lg dark:border-neutral-700 flex-col sm:flex-row text-center sm:text-left items-center">
                        <div className="mb-2 sm:mb-0">
                            <p className="text-slate-700 dark:text-neutral-300 font-bold mb-1 text-lg sm:text-2xl">{t('projects.link-title')} 🤖</p>
                            <p className="text-slate-500 dark:text-neutral-400 text-sm sm:text-lg">{t('projects.link-content')}</p>
                        </div>
                        <Link to="https://github.com/romulodm?tab=repositories" target="_blank">
                            <button className="flex px-5 min-w-44 text-sm md:text-md justify-center w-full font-semibold items-center gap-2 p-3 bg-purple-800 dark:bg-purple-800/50 hover:bg-purple-700 dark:hover:bg-purple-700/50 rounded-lg text-white">
                                {t('projects.link-button')}
                                <FaArrowRightLong/>
                            </button>
                        </Link>
                    </div>
                </div>

                {/*Visão*/}
                <div className="flex flex-col justify-center w-full">
                    <div className="flex flex-row justify-center w-full py-2">
                        <div className="flex flex-col items-center justify-center">
                            <div id="vision-line" className="h-24 w-0.5" />
                            <div id="vision-icon" className="flex items-center p-3 border-0 rounded-full text-green-700 dark:text-white">
                                <GoCodeOfConduct />
                            </div>
                            <div className="flex flex-row items-center text-3xl font-bold gap-1 mt-4">
                                <p className="text-gray-900 dark:text-neutral-400">{t('vision.title')}</p>
                                <p id="resume-title" className='text-green-600'>{t('vision.title-colored')}</p>
                            </div>                        
                        </div>
                    </div>
      
                    <Vision/>

                    <hr className="mt-1 mb-5 dark:border-[#2f3031]"/>
            
                    <div className="flex items-center justify-between w-full py-4 px-2 sm:py-8 sm:px-6 bg-gray-200 dark:bg-neutral-800 border rounded-lg dark:border-neutral-700 flex-col sm:flex-row text-center sm:text-left items-center">
                        <div className="mb-2 sm:mb-0">
                            <p className="text-slate-700 dark:text-neutral-300 font-bold mb-1 text-lg sm:text-2xl">{t('vision.link-title')} 📝</p>
                            <p className="text-slate-500 dark:text-neutral-400 text-sm sm:text-lg">{t('vision.link-content')}</p>
                        </div>
                        <NavLink to="/blog">
                            <button className="flex px-5 min-w-44 text-sm md:text-md justify-center w-full font-semibold items-center gap-2 p-3 bg-green-600 dark:bg-green-600/50 hover:bg-green-500 dark:hover:bg-green-500/50 rounded-lg text-white">
                                {t('vision.link-button')}
                                <FaArrowRightLong/>
                            </button>
                        </NavLink>
                    </div>

                </div>

                {/*Contato*/}
                <div className="flex flex-col justify-center w-full">
                    <div className="flex flex-row justify-center w-full py-2">
                        <div className="flex flex-col items-center justify-center">
                            <div id="contact-line" className="h-24 w-0.5" />
                            <div id="contact-icon" className="flex items-center p-3 border-0 rounded-full text-red-800 dark:text-white">
                                <FiAtSign />
                            </div>
                            <div className="flex flex-row items-center text-3xl font-bold gap-1 mt-4">
                                <p className="text-gray-900 dark:text-neutral-400">{t('contact.title')}</p>
                                <p id="resume-title" className='text-[#f9305b]'>{t('contact.title-colored')}</p>
                            </div>     
                        </div>
                    </div>

                    <Contact/>

                </div>


                <Footer/>

            </div>
        </div>
        
    </>
    );
}
