import React from 'react';
import { Mail, Phone } from 'lucide-react';

const CollaborationSection = () => {
    return (
        <section id="oportunidades" className="bg-[#F3E6D0] py-20 px-6 border-t-8 border-[#3D2B1F]">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#3D2B1F] mb-6">
                    Oportunidades de colaboración
                </h2>

                <p className="text-[#3D2B1F] text-lg leading-relaxed mb-12 max-w-2xl mx-auto font-medium">
                    En Ferreyra estamos abiertos a nuevas alianzas comerciales. <br className="hidden md:block" />
                    Ofrecemos franquicias y acuerdos para preventistas interesados en incorporar nuestros productos a su red de clientes.
                </p>

                <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center justify-center">
                    <a
                        href="mailto:hernanpedemonte@outlook.com"
                        className="group flex items-center gap-3 text-[#3D2B1F] hover:text-[#C99A3A] transition-colors"
                    >
                        <Mail size={22} className="text-[#3D2B1F] group-hover:text-[#C99A3A] transition-colors" />
                        <span className="text-lg font-serif">hernanpedemonte@outlook.com</span>
                    </a>

                    <div className="hidden md:block w-px h-8 bg-[#3D2B1F]/20"></div>

                    <a
                        href="https://wa.me/543414689424"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 text-[#3D2B1F] hover:text-[#C99A3A] transition-colors"
                    >
                        <Phone size={22} className="text-[#3D2B1F] group-hover:text-[#C99A3A] transition-colors" />
                        <span className="text-lg font-serif">+54 341 468 9424</span>
                    </a>
                </div>
            </div>
        </section>
    );
};

export default CollaborationSection;
