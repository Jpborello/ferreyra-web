"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const FeaturedCarousel = ({ slides = [] }) => {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        if (slides.length <= 1) return; // Don't auto-play if 0 or 1 slide

        const timer = setInterval(() => {
            nextSlide();
        }, 6000);
        return () => clearInterval(timer);
    }, [current, slides.length]); // Add updated dependency

    const nextSlide = () => {
        if (!slides.length) return;
        setDirection(1);
        setCurrent((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        if (!slides.length) return;
        setDirection(-1);
        setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95
        })
    };

    if (!slides.length) return null;

    // Safety check: ensure current index is valid
    const slide = slides[current];
    if (!slide) {
        // If out of bounds relative to new slides, reset or return null temporarily
        if (current >= slides.length && slides.length > 0) {
            setTimeout(() => setCurrent(0), 0);
        }
        return null;
    }

    return (
        <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-[#3D2B1F] border-y-8 border-[#C99A3A] group">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={current}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.4 }
                    }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <Image
                            src={typeof slide.image === 'string' ? slide.image.trim() : '/placeholder.jpg'}
                            alt={slide.title || 'Slide'}
                            fill
                            priority={current === 0}
                            className="w-full h-full object-cover sepia-[0.3] brightness-75"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#3D2B1F] via-[#3D2B1F]/40 to-transparent mix-blend-multiply"></div>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-20">

                        {/* Badge / Tag */}
                        {slide.tag && (
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-[#C99A3A] text-[#3D2B1F] text-xs font-bold px-4 py-1 uppercase tracking-[0.2em] mb-6 shadow-lg inline-block transform -rotate-2"
                            >
                                {slide.tag}
                            </motion.div>
                        )}

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl md:text-6xl font-serif font-bold text-[#F3E6D0] mb-4 drop-shadow-xl"
                        >
                            {slide.title}
                        </motion.h2>

                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="h-1 w-24 bg-[#C99A3A] mb-6"
                        ></motion.div>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-lg md:text-xl text-[#F3E6D0]/90 max-w-2xl font-serif italic mb-10 leading-relaxed"
                        >
                            "{slide.subtitle}"
                        </motion.p>

                        {slide.action && (
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ delay: 0.7 }}
                                onClick={slide.onAction}
                                className="bg-[#C99A3A] hover:bg-[#F3E6D0] text-[#3D2B1F] px-10 py-3 text-sm font-bold uppercase tracking-[0.25em] transition-all border-2 border-[#C99A3A] hover:border-[#F3E6D0] shadow-lg"
                            >
                                {slide.action}
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute inset-0 flex items-center justify-between px-4 z-30 pointer-events-none">
                <button
                    onClick={prevSlide}
                    className="p-3 rounded-full bg-[#3D2B1F]/50 text-[#C99A3A] backdrop-blur-sm border border-[#C99A3A]/30 hover:bg-[#C99A3A] hover:text-[#3D2B1F] transition-all pointer-events-auto opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 duration-300"
                >
                    <ChevronLeft size={32} />
                </button>
                <button
                    onClick={nextSlide}
                    className="p-3 rounded-full bg-[#3D2B1F]/50 text-[#C99A3A] backdrop-blur-sm border border-[#C99A3A]/30 hover:bg-[#C99A3A] hover:text-[#3D2B1F] transition-all pointer-events-auto opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 duration-300"
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            {/* Dots */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-30">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setDirection(index > current ? 1 : -1);
                            setCurrent(index);
                        }}
                        className={`w-3 h-3 rounded-full transition-all duration-300 border border-[#C99A3A] ${index === current ? 'bg-[#C99A3A] scale-125' : 'bg-transparent hover:bg-[#C99A3A]/50'
                            }`}
                    />
                ))}
            </div>

            {/* Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cardboard-flat.png")' }}></div>
        </div>
    );
};

export default FeaturedCarousel;
