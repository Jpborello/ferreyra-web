"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Ticket, Star } from 'lucide-react';

const TicketDisplay = ({ ticketNumber, raffleTitle }) => {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative w-full max-w-sm mx-auto my-6"
        >
            {/* Ticket Shape */}
            <div className="bg-gradient-to-r from-[#C99A3A] to-[#E5C579] rounded-xl p-1 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>

                {/* Perforations */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F3E6D0] rounded-full"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F3E6D0] rounded-full"></div>

                <div className="bg-[#3D2B1F] rounded-lg p-6 border-2 border-[#F3E6D0]/30 text-center relative z-10">
                    <div className="flex justify-center mb-2">
                        <Star className="text-[#C99A3A] animate-pulse" fill="#C99A3A" size={24} />
                    </div>

                    <h4 className="text-[#C99A3A] text-xs font-bold uppercase tracking-[0.3em] mb-1">Tu Número de la Suerte</h4>
                    <h3 className="text-[#F3E6D0] font-serif text-lg italic mb-4">"{raffleTitle}"</h3>

                    <div className="bg-[#F3E6D0] py-4 px-8 rounded-md mb-4 transform -rotate-1 shadow-inner">
                        <span className="text-4xl font-mono font-bold text-[#3D2B1F] tracking-widest">
                            {ticketNumber}
                        </span>
                    </div>

                    <p className="text-[#F3E6D0]/60 text-xs">
                        Este ticket ya está registrado a tu nombre.<br />
                        ¡Mucha suerte! 🍀
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default TicketDisplay;
