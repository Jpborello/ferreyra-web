"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Phone, MapPin, Truck, Award, Search, Menu, X, ChevronRight, Star, ArrowRight, User, Lock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FeaturedCarousel from '../components/FeaturedCarousel';

import TicketDisplay from '../components/TicketDisplay';

const Home = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [slides, setSlides] = useState([]);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    // Cart State
    const [cart, setCart] = useState([]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        fetchProducts();
        fetchSlides();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const fetchSlides = async () => {
        try {
            const { data, error } = await supabase
                .from('slides')
                .select('*')
                .eq('active', true)
                .order('display_order', { ascending: true });

            if (data && data.length > 0) {
                const mappedSlides = data.map(s => ({
                    image: s.image_url,
                    title: s.title,
                    subtitle: s.subtitle,
                    tag: s.tag,
                    action: s.action_text,
                    onAction: () => {
                        if (s.action_url) {
                            if (s.action_url.startsWith('http')) {
                                window.open(s.action_url, '_blank');
                            } else if (s.action_url.startsWith('#')) {
                                // Internal anchor
                                const id = s.action_url.substring(1);
                                const el = document.getElementById(id);
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            } else {
                                // Maybe category filter? e.g. "category:vacuna"
                                // simple implementation for now:
                                console.log("Action:", s.action_url);
                            }
                        }
                    }
                }));
                setSlides(mappedSlides);
            } else {
                // Fallback Mock Data if table empty
                setSlides([
                    {
                        image: "/hero-rustic.png",
                        title: "Sabores de Fiesta",
                        subtitle: "Preparate para compartir los mejores momentos.",
                        tag: "Especial Fin de Año",
                        action: "Ver Promociones",
                        onAction: () => {
                            const element = document.getElementById('catalog');
                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                ]);
            }
        } catch (e) {
            console.error("Error fetching slides", e);
        }
    };


    const fetchProducts = async () => {
        try {
            // 2. Fetch Products
            const { data, error } = await supabase
                .from('products')
                .select('id, name, price, category, image_url, is_active')
                .eq('is_active', true);

            if (error) {
                console.error("Supabase error:", error);
            } else {
                const normalized = data.map(d => ({
                    ...d,
                    price: Number(d.price),
                    // Handle category relation vs flatted string. 
                    // If categories is an object (joined), use its name. Fallback to existing logic if it was a direct column.
                    category: d.category || 'Varios'
                }));
                setProducts(normalized);
            }
        } catch (e) {
            console.error("Fetch error:", e);
            // Fallback
            setProducts([
                { id: 1, name: "Salamin Picado Grueso", price: 8500, category: "embutidos", image_url: "/prod-salamin.png", unit: "kg" },
                { id: 2, name: "Chorizo Puro Cerdo", price: 6200, category: "embutidos", image_url: "/prod-chorizo.png", unit: "kg" },
                { id: 3, name: "Bondiola Curada", price: 14500, category: "fiambres", image_url: "/prod-bondiola.png", unit: "kg" },
                { id: 4, name: "Queso de Campo", price: 9200, category: "quesos", image_url: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=2673", unit: "kg" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product, qty = 1) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + qty } : p);
            }
            return [...prev, { ...product, quantity: qty }];
        });
    };

    const updateQuantity = (productId, newQty) => {
        if (newQty < 0) return;
        setCart(prev => {
            if (newQty === 0) return prev.filter(p => p.id !== productId);
            return prev.map(p => p.id === productId ? { ...p, quantity: newQty } : p);
        });
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const categories = ['all', ...new Set(products.map(p => p.category))];
    const filteredProducts = categoryFilter === 'all' ? products : products.filter(p => p.category === categoryFilter);

    const handleOrderClick = () => {
        setCheckoutOpen(true);
    };

    const getWhatsAppLink = () => {
        return `https://wa.me/5493414689424?text=Hola,%20quisiera%20más%20información%20sobre%20los%20productos%20mayoristas.`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(price);
    };

    // Sub-components
    const ProductQuantityControl = ({ product, currentQty }) => {
        if (currentQty === 0) {
            return (
                <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-[#3D2B1F] hover:bg-[#C99A3A] text-white py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 group-active:translate-y-0.5 touch-manipulation"
                >
                    <ShoppingBag size={14} />
                    Agregar
                </button>
            );
        }
        return (
            <div className="flex items-center justify-between bg-[#F3E6D0] border border-[#3D2B1F]/20 rounded-sm overflow-hidden">
                <button
                    onClick={() => updateQuantity(product.id, currentQty - 1)}
                    className="px-4 py-2 bg-[#3D2B1F]/10 hover:bg-[#3D2B1F]/20 text-[#3D2B1F] font-bold hover:text-red-700"
                >
                    -
                </button>
                <input
                    type="number"
                    value={currentQty}
                    onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                    className="w-12 text-center bg-transparent font-serif font-bold text-[#3D2B1F] focus:outline-none"
                    min="0"
                />
                <button
                    onClick={() => updateQuantity(product.id, currentQty + 1)}
                    className="px-4 py-2 bg-[#3D2B1F]/10 hover:bg-[#3D2B1F]/20 text-[#3D2B1F] font-bold hover:text-green-700"
                >
                    +
                </button>
            </div>
        );
    };

    const ProductCard = ({ product }) => (
        <motion.div
            layout
            className="group bg-[#F3E6D0] border border-[#3D2B1F]/20 hover:border-[#3D2B1F] hover:shadow-[8px_8px_0px_0px_rgba(61,43,31,0.1)] transition-all duration-300 flex flex-col"
        >
            <div className="relative h-64 overflow-hidden border-b border-[#3D2B1F]/10 bg-white">
                <div className="absolute top-3 right-3 z-10">
                    <div className="bg-[#5B6236] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">Mayorista</div>
                </div>

                <Image
                    src={typeof product.image_url === 'string' ? product.image_url.trim() : "/placeholder.jpg"}
                    alt={product.name}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 sepia-[.1]"
                />
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-serif font-bold text-[#3D2B1F] mb-2 leading-snug">{product.name}</h3>
                <p className="text-sm text-[#3D2B1F]/60 mb-6 font-medium leading-relaxed flex-grow border-b border-[#3D2B1F]/10 pb-4 border-dashed">
                    {product.category}
                </p>

                <div className="mt-auto">
                    <div className="flex items-baseline justify-between mb-4">
                        <span className="text-[10px] uppercase font-bold text-[#3D2B1F]/50 tracking-wider">Precio x {product.unit || 'Kg'}</span>
                        <span className="text-2xl font-serif font-bold text-[#C99A3A]">{formatPrice(product.price)}</span>
                    </div>

                    <ProductQuantityControl
                        product={product}
                        currentQty={cart.find(c => c.id === product.id)?.quantity || 0}
                    />
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F3E6D0] font-sans text-[#3D2B1F] selection:bg-[#C99A3A] selection:text-[#3D2B1F]">
            {/* SEO removed, handled by Next.js metadata */}

            {/* Kraft Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-40 mix-blend-multiply z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cardboard-flat.png")' }}></div>

            {/* Navigation - Rustic Elegant */}
            <nav className={`fixed w-full z-50 transition-all duration-300 border-b border-[#3D2B1F]/10 ${scrolled ? 'bg-[#F3E6D0]/95 backdrop-blur-md shadow-md py-2' : 'bg-[#F3E6D0] py-4'}`}>
                <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center text-[#3D2B1F]">

                    {/* Logo Section */}
                    <div className="flex items-center gap-3">
                        <div className="border-2 border-[#3D2B1F] rounded-full p-1 relative w-14 h-14 overflow-hidden">
                            <Image src="/logo.jpg" alt="Embutidos Ferreyra" fill className="rounded-full object-cover sepia-[.3]" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-serif font-bold tracking-tight leading-none uppercase">Embutidos Ferreyra</h1>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-[#C99A3A] uppercase mt-0.5">Calidad de Campo</span>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#hero" className="text-sm font-bold uppercase tracking-wider hover:text-[#C99A3A] transition-colors">Inicio</a>
                        <a href="#story" className="text-sm font-bold uppercase tracking-wider hover:text-[#C99A3A] transition-colors">Historia</a>
                        <a href="#catalog" className="text-sm font-bold uppercase tracking-wider hover:text-[#C99A3A] transition-colors">Productos</a>
                        <button
                            onClick={handleOrderClick}
                            className="bg-[#3D2B1F] hover:bg-[#C99A3A] text-[#F3E6D0] hover:text-[#3D2B1F] px-6 py-2 rounded-sm text-sm font-bold tracking-widest uppercase transition-all flex items-center gap-2 border border-[#3D2B1F] touch-manipulation"
                        >
                            <User size={16} />
                            {cartCount > 0 ? `Ver Pedido (${cartCount})` : 'Ingresar'}
                        </button>
                    </div>

                    {/* Mobile Menu Button - Flex Container for Alignment */}
                    <div className="flex md:hidden items-center gap-4">
                        {/* Cart Icon Visible on Mobile Header */}
                        <button
                            onClick={handleOrderClick}
                            className="text-[#3D2B1F] relative p-2 touch-manipulation"
                        >
                            <User size={24} />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-[#C99A3A] text-[#3D2B1F] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[#3D2B1F] p-2 hover:bg-[#3D2B1F]/10 rounded-md transition-colors touch-manipulation">
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="fixed top-20 left-0 w-full z-40 bg-[#F3E6D0] border-b border-[#3D2B1F]/20 md:hidden overflow-hidden shadow-lg"
                    >
                        <div className="flex flex-col p-6 gap-4 text-center">
                            <a onClick={() => setMobileMenuOpen(false)} href="#hero" className="font-serif font-bold text-[#3D2B1F] uppercase tracking-widest py-3 border-b border-[#3D2B1F]/10">Inicio</a>
                            <a onClick={() => setMobileMenuOpen(false)} href="#story" className="font-serif font-bold text-[#3D2B1F] uppercase tracking-widest py-3 border-b border-[#3D2B1F]/10">Historia</a>
                            <a onClick={() => setMobileMenuOpen(false)} href="#catalog" className="font-serif font-bold text-[#3D2B1F] uppercase tracking-widest py-3 border-b border-[#3D2B1F]/10">Productos</a>
                            <button onClick={handleOrderClick} className="bg-[#3D2B1F] text-[#F3E6D0] py-4 uppercase font-bold tracking-widest mt-2 w-full">
                                {cartCount > 0 ? `Ver Pedido (${cartCount})` : 'Ingresar'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section - Vintage & Rustic */}
            <section id="hero" className="relative h-[80vh] flex items-center justify-center overflow-hidden mt-20">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/hero-rustic.png"
                        alt="Background"
                        fill
                        priority
                        className="w-full h-full object-cover sepia-[.3] contrast-110"
                    />
                    <div className="absolute inset-0 bg-[#3D2B1F]/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-black/30"></div>
                </div>

                <div className="relative z-20 max-w-4xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="border-4 border-[#F3E6D0]/20 p-8 md:p-12 bg-[#3D2B1F]/60 backdrop-blur-sm shadow-2xl relative"
                    >
                        {/* Corner Decorations */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#C99A3A] -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#C99A3A] -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#C99A3A] -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#C99A3A] -mb-1 -mr-1"></div>

                        <div className="mb-6 flex justify-center">
                            <div className="bg-[#C99A3A] text-[#3D2B1F] text-xs font-bold px-4 py-1 uppercase tracking-[0.2em] rounded-sm transform -rotate-1 shadow-md border border-[#3D2B1F]">
                                Directo de Fábrica
                            </div>
                        </div>

                        <h2 className="text-5xl md:text-7xl font-serif text-[#F3E6D0] mb-6 leading-tight font-bold drop-shadow-md">
                            Tradición <br />
                            <span className="italic font-light text-[#C99A3A]">Artesanal</span>
                        </h2>

                        <p className="text-xl md:text-2xl text-[#F3E6D0]/90 max-w-2xl mx-auto mb-10 font-serif italic">
                            "Sabores que nacen de la tierra y perduran en el tiempo."
                        </p>

                        <div className="flex justify-center">
                            <a
                                href="#catalog"
                                className="bg-[#C99A3A] hover:bg-[#F3E6D0] text-[#3D2B1F] px-10 py-3 text-sm font-bold uppercase tracking-[0.25em] transition-all border-2 border-[#C99A3A] hover:border-[#F3E6D0]"
                            >
                                Ver Productos
                            </a>
                        </div>
                    </motion.div>
                </div>

                {/* Vintage Badge Stamp */}
                <div className="absolute bottom-[-40px] right-[-40px] md:bottom-10 md:right-10 z-30 opacity-90 hidden md:block">
                    <div className="relative w-40 h-40 animate-spin-slow">
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-[#C99A3A]">
                            <path d="M50,0 C77.6142375,0 100,22.3857625 100,50 C100,77.6142375 77.6142375,100 50,100 C22.3857625,100 0,77.6142375 0,50 C0,22.3857625 22.3857625,0 50,0 Z M50,5 C25.1471863,5 5,25.1471863 5,50 C5,74.8528137 25.1471863,95 50,95 C74.8528137,95 95,74.8528137 95,50 C95,25.1471863 74.8528137,5 50,5 Z" fillRule="evenodd" />
                            <path id="curve" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="transparent" />
                            <text fontSize="11" fontWeight="bold" letterSpacing="2">
                                <textPath href="#curve" startOffset="50%" textAnchor="middle" fill="#3D2B1F">
                                    CALIDAD PREMIUM • DESDE EL ORIGEN •
                                </textPath>
                            </text>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Star size={32} className="text-[#3D2B1F]" fill="#3D2B1F" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Storytelling Section */}
            <section id="story" className="py-24 max-w-7xl mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="md:w-1/2 relative h-[400px]">
                        <div className="absolute inset-0 bg-[#C99A3A] transform translate-x-4 translate-y-4"></div>
                        <Image
                            src="/story-rustic.png"
                            alt="Campo Argentino"
                            fill
                            className="relative z-10 w-full h-full object-cover sepia-[.2] shadow-xl border-2 border-[#3D2B1F]"
                        />
                    </div>
                    <div className="md:w-1/2">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="h-px w-12 bg-[#3D2B1F]"></span>
                            <span className="text-[#5B6236] font-bold uppercase tracking-[0.2em] text-sm">Nuestra Esencia</span>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-serif font-bold text-[#3D2B1F] mb-8 leading-tight">
                            Del Campo a la<br />Mesa de los Argentinos
                        </h3>
                        <p className="text-lg text-[#3D2B1F]/80 mb-6 font-serif italic leading-relaxed border-l-4 border-[#C99A3A] pl-6">
                            "Nacimos entre el campo y la tradición. Cada corte, cada embutido, lleva el tiempo, el sabor y el oficio de generaciones."
                        </p>
                        <p className="text-[#3D2B1F]/70 mb-8 leading-loose font-medium">
                            En Embutidos Ferreyra, no solo procesamos alimentos; honramos el trabajo de nuestra tierra. Mantenemos la calidad y frescura para ofrecer un producto que se distingue en el primer bocado.
                        </p>
                        <p className="font-signature text-6xl md:text-7xl text-[#3D2B1F]/90 mt-4 -rotate-2">
                            Familia Ferreyra
                        </p>
                    </div>
                </div>
            </section>



            {/* Quality Parallax Strip */}
            <section className="relative h-[40vh] flex items-center justify-center overflow-hidden my-12">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/macro-meat.png"
                        alt="Textura Premium"
                        fill
                        className="w-full h-full object-cover filter brightness-[0.7] sepia-[.1]"
                    />
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>
                <div className="relative z-10 text-center px-4">
                    <Star className="text-[#C99A3A] w-12 h-12 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-3xl md:text-5xl font-serif font-bold text-[#F3E6D0] tracking-wide mb-2 italic drop-shadow-lg">
                        "El secreto está en la maduración"
                    </h3>
                    <div className="h-1 w-24 bg-[#C99A3A] mx-auto my-4"></div>
                    <p className="text-[#C99A3A] uppercase tracking-[0.3em] text-sm font-bold shadow-black drop-shadow-md">
                        Calidad que se siente
                    </p>
                </div>
            </section>

            {/* Featured / Events Carousel */}
            <section className="relative z-20">
                <FeaturedCarousel slides={slides} />
            </section>

            {/* Catalog Section */}
            <section id="catalog" className="py-24 bg-[#EBE0C8]/50 relative border-t border-[#3D2B1F]/10">
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <MusicIconDecoration />
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3D2B1F] mb-4 mt-6">Nuestros Productos</h2>
                        <p className="text-[#5B6236] font-bold uppercase tracking-[0.2em] text-sm">Selección de Campo</p>
                    </div>



                    {loading ? (
                        <div className="flex justify-center py-24">
                            <div className="w-12 h-12 border-4 border-[#3D2B1F] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div>
                            {/* CATEGORY SELECTION VIEW */}
                            {categoryFilter === 'all' && (
                                <div className="space-y-8">
                                    <div className="text-center mb-12">
                                        <h3 className="text-3xl font-serif font-bold text-[#3D2B1F] mb-4">¿Qué estás buscando hoy?</h3>
                                        <p className="text-[#3D2B1F]/60 italic">Seleccioná una categoría para ver nuestros cortes y productos.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                        {/* Avicola Card */}
                                        <div
                                            onClick={() => setCategoryFilter('avicola')}
                                            className="group relative h-80 rounded-sm overflow-hidden cursor-pointer shadow-lg border-2 border-[#3D2B1F]/10 hover:border-[#C99A3A] transition-all"
                                        >
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                                            <Image src="/cat-chicken.jpg" alt="Avicola" fill className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                                                <h3 className="text-4xl font-serif font-bold text-[#F3E6D0] mb-2 drop-shadow-md group-hover:translate-y-[-5px] transition-transform">Línea Avícola</h3>
                                                <p className="text-[#C99A3A] font-bold uppercase tracking-widest text-sm opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0">Ver Productos</p>
                                            </div>
                                        </div>

                                        {/* Vacuna Card */}
                                        <div
                                            onClick={() => setCategoryFilter('vacuna')}
                                            className="group relative h-80 rounded-sm overflow-hidden cursor-pointer shadow-lg border-2 border-[#3D2B1F]/10 hover:border-[#C99A3A] transition-all"
                                        >
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                                            <Image src="/cat-meat.jpg" alt="Vacuna" fill className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                                                <h3 className="text-4xl font-serif font-bold text-[#F3E6D0] mb-2 drop-shadow-md group-hover:translate-y-[-5px] transition-transform">Ternera & Novillo</h3>
                                                <p className="text-[#C99A3A] font-bold uppercase tracking-widest text-sm opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0">Ver Productos</p>
                                            </div>
                                        </div>

                                        {/* Cerdo Card */}
                                        <div
                                            onClick={() => setCategoryFilter('cerdo')}
                                            className="group relative h-80 rounded-sm overflow-hidden cursor-pointer shadow-lg border-2 border-[#3D2B1F]/10 hover:border-[#C99A3A] transition-all"
                                        >
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                                            <Image src="/cat-pork.jpg" alt="Cerdo" fill className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                                                <h3 className="text-4xl font-serif font-bold text-[#F3E6D0] mb-2 drop-shadow-md group-hover:translate-y-[-5px] transition-transform">Cerdo Premium</h3>
                                                <p className="text-[#C99A3A] font-bold uppercase tracking-widest text-sm opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0">Ver Productos</p>
                                            </div>
                                        </div>

                                        {/* Huevos Card */}
                                        <div
                                            onClick={() => setCategoryFilter('huevo')}
                                            className="group relative h-80 rounded-sm overflow-hidden cursor-pointer shadow-lg border-2 border-[#3D2B1F]/10 hover:border-[#C99A3A] transition-all"
                                        >
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                                            <Image src="/cat-eggs.jpg" alt="Huevos" fill className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                                                <h3 className="text-4xl font-serif font-bold text-[#F3E6D0] mb-2 drop-shadow-md group-hover:translate-y-[-5px] transition-transform">Huevos de Campo</h3>
                                                <p className="text-[#C99A3A] font-bold uppercase tracking-widest text-sm opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0">Ver Productos</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fallback for others if needed */}
                                    {products.some(p => !p.category.match(/pollo|vacuna|ternera|cerdo|porcino|huevo/i)) && (
                                        <div className="text-center mt-8">
                                            <button
                                                onClick={() => setCategoryFilter('otros')}
                                                className="text-[#3D2B1F] underline italic hover:text-[#C99A3A] transition-colors"
                                            >
                                                Ver otros productos de despensa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PRODUCT GRID VIEW */}
                            {categoryFilter !== 'all' && (
                                <div className="space-y-8">
                                    {/* Category Navigation Bar */}
                                    <div className="flex flex-col md:flex-row items-center gap-4 mb-8 bg-[#F3E6D0] border-b-2 border-[#3D2B1F]/10 pb-4 sticky top-20 z-30 pt-4">

                                        {/* Back Button */}
                                        <button
                                            onClick={() => setCategoryFilter('all')}
                                            className="flex items-center gap-2 text-[#3D2B1F] hover:text-[#C99A3A] font-bold uppercase tracking-widest text-xs transition-colors border border-[#3D2B1F]/20 px-3 py-2 rounded hover:bg-[#3D2B1F] hover:border-[#3D2B1F] whitespace-nowrap"
                                        >
                                            <ChevronRight className="rotate-180" size={16} />
                                            Volver
                                        </button>

                                        {/* Category Tabs */}
                                        <div className="flex flex-wrap justify-center gap-2 flex-grow">
                                            {[
                                                { id: 'avicola', label: 'Avícola' },
                                                { id: 'vacuna', label: 'Ternera' },
                                                { id: 'cerdo', label: 'Cerdo' },
                                                { id: 'huevo', label: 'Huevos' },
                                                { id: 'otros', label: 'Despensa' },
                                            ].map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setCategoryFilter(cat.id)}
                                                    className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all
                                                        ${categoryFilter === cat.id
                                                            ? 'bg-[#3D2B1F] text-[#F3E6D0] shadow-md transform scale-105'
                                                            : 'bg-[#3D2B1F]/5 text-[#3D2B1F] hover:bg-[#C99A3A] hover:text-[#3D2B1F]'
                                                        }`}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>

                                        <p className="text-xs md:text-sm text-[#3D2B1F]/80 italic font-medium hidden md:block">
                                            * Imágenes ilustrativas
                                        </p>
                                    </div>

                                    {/* Category Title (Optional, as tabs show active) */}
                                    <div className="text-center md:text-left mb-4">
                                        <h3 className="text-2xl font-serif font-bold text-[#3D2B1F] uppercase">
                                            {categoryFilter === 'avicola' && 'Línea Avícola'}
                                            {categoryFilter === 'vacuna' && 'Ternera & Novillo'}
                                            {categoryFilter === 'cerdo' && 'Cerdo Premium'}
                                            {categoryFilter === 'huevo' && 'Huevos de Campo'}
                                            {categoryFilter === 'otros' && 'Despensa y Varios'}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {products.filter(p => {
                                            const cat = p.category.toLowerCase();
                                            if (categoryFilter === 'avicola') return cat.includes('pollo');
                                            if (categoryFilter === 'vacuna') return cat.includes('vacuna') || cat.includes('ternera');
                                            if (categoryFilter === 'cerdo') return cat.includes('cerdo') || cat.includes('porcino');
                                            if (categoryFilter === 'huevo') return cat.includes('huevo');
                                            if (categoryFilter === 'otros') return !cat.match(/pollo|vacuna|ternera|cerdo|porcino|huevo/i);
                                            return true;
                                        }).map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Floating Cart Summary - Mobile/Desktop */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 w-full z-40 bg-[#3D2B1F] text-[#F3E6D0] p-4 shadow-2xl border-t-4 border-[#C99A3A] flex justify-between items-center"
                    >
                        <div className="flex flex-col md:flex-row items-baseline gap-2 md:gap-4">
                            <span className="text-sm uppercase tracking-widest text-[#C99A3A]">Su Pedido:</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold font-serif">{cartCount} Ítems</span>
                                <span className="text-sm opacity-60">|</span>
                                <span className="text-xl font-bold">{formatPrice(cartTotal)}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setCheckoutOpen(true)}
                            className="bg-[#C99A3A] hover:bg-[#F3E6D0] text-[#3D2B1F] px-8 py-3 rounded-sm font-bold uppercase tracking-[0.15em] transition-colors shadow-lg"
                        >
                            Finalizar Pedido
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Origin & Coverage Section */}
            <section id="coverage" className="relative h-[60vh] flex items-center justify-center overflow-hidden border-t-8 border-[#C99A3A]">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/farm-rustic.png"
                        alt="Campo Argentino"
                        fill
                        className="w-full h-full object-cover sepia-[.2] contrast-110"
                    />
                    <div className="absolute inset-0 bg-[#3D2B1F]/70 mix-blend-multiply"></div>
                </div>

                <div className="relative z-20 text-center max-w-4xl px-4">
                    <span className="bg-[#C99A3A] text-[#3D2B1F] text-xs font-bold px-4 py-1 uppercase tracking-[0.2em] mb-4 inline-block">
                        Trazabilidad Completa
                    </span>
                    <h3 className="text-4xl md:text-6xl font-serif font-bold text-[#F3E6D0] mb-8 leading-tight drop-shadow-lg">
                        Del Campo<br />a tu Comercio
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[#F3E6D0] mt-8">
                        <div className="bg-[#3D2B1F]/80 backdrop-blur-sm p-6 border border-[#C99A3A]/30 flex flex-col items-center">
                            <MapPin className="mb-4 text-[#C99A3A]" size={32} />
                            <h4 className="font-bold uppercase tracking-wider mb-2">Santa Fe</h4>
                            <p className="text-sm opacity-80">Distribución diaria en Rosario y Gran Rosario</p>
                        </div>
                        <div className="bg-[#3D2B1F]/80 backdrop-blur-sm p-6 border border-[#C99A3A]/30 flex flex-col items-center">
                            <Truck className="mb-4 text-[#C99A3A]" size={32} />
                            <h4 className="font-bold uppercase tracking-wider mb-2">Litoral</h4>
                            <p className="text-sm opacity-80">Rutas semanales a Entre Ríos y Norte de Bs. As.</p>
                        </div>
                        <div className="bg-[#3D2B1F]/80 backdrop-blur-sm p-6 border border-[#C99A3A]/30 flex flex-col items-center">
                            <Award className="mb-4 text-[#C99A3A]" size={32} />
                            <h4 className="font-bold uppercase tracking-wider mb-2">Sin Intermediarios</h4>
                            <p className="text-sm opacity-80">Garantía de cadena de frío y precio de fábrica</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer - Farm Style */}
            <footer className="bg-[#3D2B1F] text-[#F3E6D0] py-16 relative overflow-hidden border-t-8 border-[#C99A3A]">
                {/* Background Illustration overlay (simulated with CSS pattern/gradient) */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 120%, #C99A3A 0%, transparent 60%)' }}></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                        <div className="flex flex-col items-center md:items-start">
                            <h4 className="text-2xl font-serif font-bold mb-6 text-[#C99A3A]">Embutidos Ferreyra</h4>
                            <p className="text-[#F3E6D0]/70 mb-6 font-light leading-relaxed max-w-xs">
                                Tradición familiar al servicio de la gastronomía. Calidad constante, sabor auténtico.
                            </p>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 border border-[#F3E6D0]/30 rounded-full flex items-center justify-center hover:bg-[#C99A3A] hover:border-[#C99A3A] transition-all cursor-pointer">
                                    <Phone size={18} />
                                </div>
                                <div className="w-10 h-10 border border-[#F3E6D0]/30 rounded-full flex items-center justify-center hover:bg-[#C99A3A] hover:border-[#C99A3A] transition-all cursor-pointer">
                                    <Truck size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 mb-6 relative">
                                <div className="absolute inset-0 border-2 border-[#C99A3A] rounded-full animate-spin-slow opacity-30 dashed-border"></div>
                                <div className="absolute inset-2 border border-[#F3E6D0]/50 rounded-full flex items-center justify-center bg-[#3D2B1F]">
                                    <Award size={32} className="text-[#C99A3A]" />
                                </div>
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest text-[#C99A3A]">Calidad Garantizada</p>
                            <p className="text-xs text-[#F3E6D0]/50 mt-1">Certificación SENASA</p>
                        </div>

                        <div className="flex flex-col items-center md:items-end">
                            <h5 className="font-bold text-[#C99A3A] uppercase tracking-widest text-sm mb-6">Contacto Directo</h5>
                            <a href={getWhatsAppLink()} className="text-2xl font-serif text-[#F3E6D0] hover:text-[#C99A3A] transition-colors mb-2">
                                +54 341 468-9424
                            </a>
                            <p className="text-[#F3E6D0]/50 text-sm mb-6">Rosario, Santa Fe</p>
                            <div className="text-xs text-[#F3E6D0]/40 uppercase tracking-widest flex flex-col items-center md:items-end gap-1">
                                <span>© 2025 Embutidos Ferreyra - Todos los derechos reservados.</span>
                                <span>
                                    Web creada por <a href="https://neo-core-sys.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#C99A3A] transition-colors border-b border-[#C99A3A]/30">Neo Core Sys</a>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                cart={cart}
                total={cartTotal}
                clearCart={() => setCart([])}
            />
        </div>
    );
};

const CheckoutModal = ({ isOpen, onClose, cart, total, clearCart }) => {
    const [step, setStep] = useState(1); // 1: Resumen, 2: Datos, 3: Éxito
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        cuit: '',
        address: '',
        city: 'Rosario',
        phone: '',
        notes: ''
    });

    // Raffle State
    const [activeRaffle, setActiveRaffle] = useState(null);
    const [ticketData, setTicketData] = useState(null);

    // Load customer data & Active Raffle
    useEffect(() => {
        const savedData = localStorage.getItem('ferreyra_customer');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Error loading saved customer data", e);
            }
        }

        fetchActiveRaffle();
    }, []);

    const fetchActiveRaffle = async () => {
        const { data } = await supabase.from('raffles').select('*').eq('status', 'active').maybeSingle();
        if (data) setActiveRaffle(data);
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Save to LocalStorage for future visits
            localStorage.setItem('ferreyra_customer', JSON.stringify({
                businessName: formData.businessName,
                cuit: formData.cuit,
                address: formData.address,
                city: formData.city,
                phone: formData.phone
            }));

            // 2. Manage Customer (Check if exists first to avoid duplicates)
            let customerId = null;

            // Try to find by phone
            const { data: existingCust } = await supabase
                .from('customers')
                .select('id')
                .eq('phone', formData.phone)
                .maybeSingle();

            if (existingCust) {
                customerId = existingCust.id;
                // Update basic info
                await supabase.from('customers').update({
                    name: formData.businessName,
                    address: formData.address, // Update default address
                    city: formData.city,
                    cuit: formData.cuit
                }).eq('id', customerId);
            } else {
                // Insert new customer
                const { data: newCust, error: createError } = await supabase.from('customers').insert({
                    name: formData.businessName,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    cuit: formData.cuit
                }).select().single();

                if (createError) throw createError;
                customerId = newCust.id;
            }

            // 3. Insert Order
            const { data: newOrder, error: orderError } = await supabase.from('orders').insert({
                customer_id: customerId,
                customer_name: `${formData.businessName} (${formData.city})`,
                customer_phone: formData.phone,
                delivery_address: `${formData.address}, ${formData.city}`,
                status: 'pending',
                total: total,
                items: cart.map(i => ({
                    id: i.id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity
                })),
                notes: formData.cuit ? `CUIT: ${formData.cuit}` : ''
            }).select().single();

            if (orderError) throw orderError;

            // 4. GENERATE RAFFLE TICKET (If active raffle exists)
            if (activeRaffle) {
                try {
                    // Get current count to generate sequential number
                    const { count } = await supabase
                        .from('raffle_tickets')
                        .select('id', { count: 'exact', head: true })
                        .eq('raffle_id', activeRaffle.id);

                    const nextNum = String((count || 0) + 1).padStart(3, '0');

                    const { data: ticket } = await supabase.from('raffle_tickets').insert({
                        raffle_id: activeRaffle.id,
                        order_id: newOrder.id,
                        customer_name: formData.businessName,
                        ticket_number: nextNum
                    }).select().single();

                    if (ticket) setTicketData({ ...ticket, raffle_title: activeRaffle.title });

                } catch (raffleError) {
                    console.error("Error generating ticket:", raffleError);
                    // Don't block order success if ticket fails
                }
            }

            setStep(3);
            clearCart();

        } catch (error) {
            console.error("Order Error Full:", JSON.stringify(error, null, 2));
            alert(`Error al enviar: ${error.message || JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-[#3D2B1F]/90 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#F3E6D0] w-full max-w-lg m-4 shadow-2xl border border-[#C99A3A] relative overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Decorative Header */}
                    <div className="bg-[#3D2B1F] p-4 flex justify-between items-center border-b-4 border-[#C99A3A]">
                        <h3 className="text-xl font-serif font-bold text-[#F3E6D0] flex items-center gap-2">
                            <ShoppingBag size={20} className="text-[#C99A3A]" />
                            {step === 1 ? 'Resumen de Pedido' : step === 2 ? 'Datos de Facturación' : '¡Pedido Confirmado!'}
                        </h3>
                        <button onClick={onClose} className="text-[#F3E6D0] hover:text-[#C99A3A] transition-colors"><X size={24} /></button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        {step === 1 && (
                            <div className="space-y-6">
                                {cart.length === 0 ? (
                                    <div className="text-center py-10 opacity-50">
                                        <p>El carrito está vacío.</p>
                                        <button onClick={onClose} className="mt-4 underline text-[#8B4513]">Volver al catálogo</button>
                                    </div>
                                ) : (
                                    <>
                                        <ul className="divide-y divide-[#3D2B1F]/10">
                                            {cart.map(item => (
                                                <li key={item.id} className="py-3 flex justify-between items-center">
                                                    <div>
                                                        <span className="font-bold text-[#3D2B1F]">{item.name}</span>
                                                        <div className="text-xs text-[#3D2B1F]/60 capitalize">{item.category}</div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-bold text-[#3D2B1F]">{item.quantity} x {item.unit || 'u'}</span>
                                                        <span className="font-serif font-bold text-[#3D2B1F] min-w-[80px] text-right">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.price * item.quantity)}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="flex justify-between items-center pt-4 border-t-2 border-[#3D2B1F]">
                                            <span className="text-lg font-bold uppercase tracking-wider text-[#3D2B1F]">Total Estimado</span>
                                            <span className="text-2xl font-serif font-bold text-[#C99A3A]">
                                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)}
                                            </span>
                                        </div>
                                        <div className="mt-8 flex justify-end">
                                            <button
                                                onClick={() => setStep(2)}
                                                className="bg-[#3D2B1F] hover:bg-[#C99A3A] text-white px-8 py-3 font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                                            >
                                                Continuar <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="bg-[#white] p-4 bg-white/50 rounded-sm border border-[#3D2B1F]/10 mb-4">
                                    <p className="text-sm text-[#3D2B1F]/70 italic flex items-start gap-2">
                                        <Award size={16} className="shrink-0 mt-0.5" />
                                        <span>
                                            <b>¡Hola!</b> Verificá que tus datos estén correctos antes de enviar el pedido. Podés editarlos si es necesario.
                                        </span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2B1F] mb-1">Razón Social / Comercio *</label>
                                        <input required type="text" className="w-full bg-white border border-[#3D2B1F]/20 p-3 text-[#3D2B1F] focus:outline-none focus:border-[#C99A3A]"
                                            value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} placeholder="Ej. Carnicería El Toro" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2B1F] mb-1">CUIT (Opcional)</label>
                                        <input type="text" className="w-full bg-white border border-[#3D2B1F]/20 p-3 text-[#3D2B1F] focus:outline-none focus:border-[#C99A3A]"
                                            value={formData.cuit} onChange={e => setFormData({ ...formData, cuit: e.target.value })} placeholder="20-xxxxxxxx-x" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2B1F] mb-1">Dirección de Entrega *</label>
                                    <input required type="text" className="w-full bg-white border border-[#3D2B1F]/20 p-3 text-[#3D2B1F] focus:outline-none focus:border-[#C99A3A]"
                                        value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Calle y Altura" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2B1F] mb-1">Localidad *</label>
                                        <select className="w-full bg-white border border-[#3D2B1F]/20 p-3 text-[#3D2B1F] focus:outline-none focus:border-[#C99A3A]"
                                            value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        >
                                            <option value="Rosario">Rosario</option>
                                            <option value="Funes">Funes</option>
                                            <option value="Roldán">Roldán</option>
                                            <option value="VGG">Villa G. Gálvez</option>
                                            <option value="Otro">Otra (Consultar)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2B1F] mb-1">WhatsApp / Teléfono *</label>
                                        <input required type="tel" className="w-full bg-white border border-[#3D2B1F]/20 p-3 text-[#3D2B1F] focus:outline-none focus:border-[#C99A3A]"
                                            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="341..." />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 flex-col sm:flex-row">
                                    <button type="button" onClick={onClose} className="w-full sm:w-1/3 border border-[#3D2B1F]/20 text-[#3D2B1F] py-3 font-bold uppercase tracking-widest hover:bg-[#3D2B1F]/5 transition-colors text-xs sm:text-sm">
                                        Seguir Comprando
                                    </button>
                                    <button disabled={loading} type="submit" className="w-full sm:w-2/3 bg-[#3D2B1F] text-[#F3E6D0] py-3 font-bold uppercase tracking-widest hover:bg-[#C99A3A] hover:text-[#3D2B1F] transition-colors flex justify-center items-center gap-2 text-xs sm:text-sm">
                                        {loading ? <span className="animate-spin w-5 h-5 border-2 border-[#F3E6D0] border-t-transparent rounded-full"></span> : 'Confirmar y Enviar'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-[#5B6236] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                                    <CheckCircle size={40} />
                                </div>
                                <h3 className="text-3xl font-serif font-bold text-[#3D2B1F] mb-4">¡Pedido Recibido!</h3>

                                {ticketData && (
                                    <TicketDisplay
                                        ticketNumber={ticketData.ticket_number}
                                        raffleTitle={ticketData.raffle_title}
                                    />
                                )}

                                <p className="text-[#3D2B1F]/80 mb-8 max-w-md mx-auto">
                                    Muchas gracias por su pedido, <strong>{formData.businessName}</strong>. <br />
                                    Nuestro equipo comercial se contactará al <strong>{formData.phone}</strong> en breve para coordinar el pago y la entrega.
                                </p>
                                <button onClick={onClose} className="bg-[#C99A3A] text-[#3D2B1F] px-8 py-3 font-bold uppercase tracking-widest hover:bg-[#F3E6D0] transition-colors">
                                    Cerrar
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Decorative Component
const MusicIconDecoration = () => (
    <div className="flex justify-center gap-1 mb-2">
        <Star size={12} className="text-[#C99A3A]" />
        <Star size={12} className="text-[#3D2B1F]" />
        <Star size={12} className="text-[#C99A3A]" />
    </div>
);

export default Home;
