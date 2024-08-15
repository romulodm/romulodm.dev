import './styles.css'

import { useTranslation } from "react-i18next";
import { FiAtSign, FiCode, FiUser } from "react-icons/fi";
import { GoCodeOfConduct } from 'react-icons/go';

import WelcomeAnimation from "../components/welcome/WelcomeAnimation";
import Title from "../components/Title";
import Hero from "../components/sections/Hero";
import Vision from "../components/sections/Vision"
import Terminal from '../components/terminal/Terminal';
import Timeline from '../components/timeline/Timeline';
import Projects from '../components/sections/Projects';
import Contact from '../components/sections/Contact';
import Footer from '../components/Footer';
import { NavLink } from 'react-router-dom';
import { FaArrowRightLong } from 'react-icons/fa6';
import Experience from '../components/infos/Experience';
import TerminalExperience from '../components/terminal/TerminalExperience';

export default function Home() {
    const { t } = useTranslation('home');
    const mobile = null;

    return (
    <>
        <Title text="Romulo - Home" />
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
                            <div id="resume-icon" className="flex items-center p-3 border rounded-full text-blue-700">
                                <FiUser />
                            </div>
                            <div className="flex flex-row items-center text-3xl font-bold gap-1 mt-4">
                                <p className="text-gray-900">Visão geral de</p>
                                <p id="resume-title" className='text-blue-700'>Perfil</p>
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

                    <hr className="mt-3 mb-5"/>

                    <div className="flex items-center justify-between w-full py-4 px-2 sm:py-8 sm:px-6 bg-gray-200 border rounded-lg flex-col sm:flex-row text-center sm:text-left items-center">
                        <div className="mb-2 sm:mb-0">
                            <p className="text-slate-700 font-bold mb-1 text-lg sm:text-2xl">Quer ver meu currículo? 📋</p>
                            <p className="text-slate-500 text-sm sm:text-lg">Resumi minhas experiências e disponibilizei o download.</p>
                        </div>
                        <NavLink to="/resume">
                            <button className="flex min-w-44 px-5 text-sm md:text-md justify-center w-full font-semibold items-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
                                Ver currículo online
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
                                <div id="projects-icon" className="flex items-center p-3 border rounded-full text-purple-800">
                                    <FiCode />
                                </div>
                                <div className="flex flex-row items-center text-3xl font-bold gap-1 mt-4">
                                    <p className="text-gray-900">Alguns</p>
                                    <p id="resume-title" className='text-purple-800'>Projetos</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Projects/>
                </div>

                {/*Visão*/}
                <div className="flex flex-col justify-center w-full">
                    <div className="flex flex-row justify-center w-full py-2">
                        <div className="flex flex-col items-center justify-center">
                            <div id="vision-line" className="h-24 w-0.5" />
                            <div id="vision-icon" className="flex items-center p-3 border rounded-full text-green-700">
                                <GoCodeOfConduct />
                            </div>
                            <div className="flex flex-row items-center text-3xl font-bold gap-1 mt-4">
                                <p className="text-gray-900">Visão sobre</p>
                                <p id="resume-title" className='text-green-600'>Software</p>
                            </div>                        
                        </div>
                    </div>
      
                    <Vision/>

                </div>

                {/*Contato*/}
                <div className="flex flex-col justify-center w-full">
                    <div className="flex flex-row justify-center w-full py-2">
                        <div className="flex flex-col items-center justify-center">
                            <div id="contact-line" className="h-24 w-0.5" />
                            <div id="contact-icon" className="flex items-center p-3 border rounded-full text-red-800">
                                <FiAtSign />
                            </div>
                            <div className="flex flex-row items-center text-3xl font-bold gap-1 mt-4">
                                <p className="text-gray-900">{t('contact.title')}</p>
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
