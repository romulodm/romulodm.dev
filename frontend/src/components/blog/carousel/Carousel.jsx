import "./Carousel.css";

import React, { useEffect, useState } from 'react';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

import CarouselNewsletter from "./CarouselNewsletter";
import CarouselSuggestions from "./CarouselSuggestions";
import CarouselAbout from "./CarouselAbout";

const carouselItems = [CarouselNewsletter, CarouselSuggestions, CarouselAbout];

export default function Carousel() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [intervalId, setIntervalId] = useState(null);

    const handlePrevSlide = () => {
        clearInterval(intervalId);
        setCurrentSlide((prevSlide) => (prevSlide === 0 ? 2 : prevSlide - 1));
        startInterval();
    };

    const handleNextSlide = () => {
        clearInterval(intervalId);
        setCurrentSlide((prevSlide) => (prevSlide === 2 ? 0 : prevSlide + 1));
        startInterval();
    };

    const handleSlideChange = (index) => {
        clearInterval(intervalId);
        setCurrentSlide(index);
        startInterval();
    };

    const startInterval = () => {
        const id = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide === 2 ? 0 : prevSlide + 1));
        }, 15000);
        setIntervalId(id);
    };

    const handleVisibilityChange = () => {
        if (document.hidden) {
            clearInterval(intervalId);
        } else {
            startInterval();
        }
    };

    useEffect(() => {
        startInterval();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return (
        <div className="w-full h-full relative mt-4">
            <div
                className="bg-blue-900"
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    overflow: "hidden",
                }}
            >
                <div className="carousel-item items-center bg-blue-900 dark:bg-sky-800 w-full min-h-[185px]" aria-hidden={currentSlide !== 0} style={{ translate: `${-100 * currentSlide}%` }}>
                    <CarouselNewsletter />
                </div>

                <div className="carousel-item items-center bg-blue-900 dark:bg-sky-800 w-full min-h-[185px]" aria-hidden={currentSlide !== 1} style={{ translate: `${-100 * currentSlide}%` }}>
                    <CarouselSuggestions />
                </div>

                <div className="carousel-item items-center bg-blue-900 dark:bg-sky-800 w-full min-h-[185px]" aria-hidden={currentSlide !== 1} style={{ translate: `${-100 * currentSlide}%` }}>
                    <CarouselAbout />
                </div>
            </div>

            <div className="hidden sm:absolute top-0 start-2.5 z-30 flex items-center justify-end h-full p-2 sm:flex">
                <button onClick={handlePrevSlide} className="flex text-white items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 focus:ring-1 focus:ring-white">
                    <NavigateBeforeIcon style={{fontSize: '1rem'}}/>
                </button>
            </div>

            <div className="hidden sm:absolute top-0 end-2.5 z-30 flex items-center justify-start h-full p-2 sm:flex">
                <button onClick={handleNextSlide} className="flex text-white items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 focus:ring-1 focus:ring-white">
                    <NavigateNextIcon style={{fontSize: '1rem'}}/>
                </button>
            </div>

            <div className="hidden sm:absolute top-0 end-2.5 z-30 flex items-center justify-start h-full p-2 sm:flex">
                <button onClick={handleNextSlide} className="flex text-white items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 focus:ring-1 focus:ring-white">
                    <NavigateNextIcon style={{fontSize: '1rem'}}/>
                </button>
            </div>

            <div className="absolute z-30 flex -translate-x-1/2 bottom-2 left-1/2 space-x-2 rtl:space-x-reverse">
                {[...Array(3)].map((_, index) => (
                    <button key={index} className={`w-2.5 h-2.5 rounded-full ${index === currentSlide ? 'bg-gray-100' : 'bg-blue-950 dark:bg-sky-950'}`} onClick={() => handleSlideChange(index)} />
                ))}
            </div>
        </div>
    );
}
