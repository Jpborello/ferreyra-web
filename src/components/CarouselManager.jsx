"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Save, ToggleLeft, ToggleRight, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUpload from './ImageUpload';

const CarouselManager = () => {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        image_url: '',
        title: '',
        subtitle: '',
        tag: '',
        action_text: '',
        action_url: '',
        active: true,
        display_order: 0
    });

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const { data, error } = await supabase
                .from('slides')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setSlides(data || []);
        } catch (error) {
            console.error('Error fetching slides:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Fix: Check if it's a new slide (editingId === 'new') or an update
            if (editingId && editingId !== 'new') {
                const { error } = await supabase
                    .from('slides')
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('slides')
                    .insert([{ ...formData, display_order: slides.length }]);
                if (error) throw error;
            }

            setEditingId(null);
            resetForm();
            fetchSlides();
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que querés eliminar este slide?')) return;
        try {
            const { error } = await supabase.from('slides').delete().eq('id', id);
            if (error) throw error;
            fetchSlides();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            image_url: '',
            title: '',
            subtitle: '',
            tag: '',
            action_text: '',
            action_url: '',
            active: true,
            display_order: 0
        });
    };

    const handleOrderChange = async (id, direction) => {
        const index = slides.findIndex(s => s.id === id);
        if (index === -1) return;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= slides.length) return;

        const otherSlide = slides[newIndex];

        // Swap orders locally first for speed (optimistic)
        const updatedSlides = [...slides];
        updatedSlides[index] = { ...updatedSlides[index], display_order: otherSlide.display_order };
        updatedSlides[newIndex] = { ...otherSlide, display_order: slides[index].display_order };

        // Sort by order to show correctly
        updatedSlides.sort((a, b) => a.display_order - b.display_order);
        setSlides(updatedSlides);

        try {
            await supabase.from('slides').upsert([
                { id: slides[index].id, display_order: otherSlide.display_order },
                { id: otherSlide.id, display_order: slides[index].display_order }
            ]);
        } catch (error) {
            console.error('Error swapping order:', error);
            fetchSlides(); // Revert on error
        }
    };

    const inputStyle = "w-full p-2 border rounded bg-white text-gray-900 border-gray-300 focus:border-[#C99A3A] focus:ring-1 focus:ring-[#C99A3A] outline-none";
    const labelStyle = "block text-sm font-bold text-[#3D2B1F] mb-1";

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#3D2B1F]">Gestión de Carrusel</h2>
                {!editingId && (
                    <button
                        onClick={() => { setEditingId('new'); resetForm(); }}
                        className="bg-[#3D2B1F] text-[#F3E6D0] px-4 py-2 rounded flex items-center gap-2 hover:bg-[#C99A3A] transition"
                    >
                        <Plus size={20} /> Nuevo Slide
                    </button>
                )}
            </div>

            {/* Form Editor */}
            <AnimatePresence>
                {editingId && (
                    <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleSave}
                        className="bg-[#F3E6D0]/30 p-6 rounded-lg mb-8 border border-[#C99A3A]/30 overflow-hidden"
                    >
                        <div className="mb-4">
                            <ImageUpload
                                onUpload={(url) => setFormData({ ...formData, image_url: url })}
                                initialImage={formData.image_url}
                                folder="promos"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelStyle}>Título</label>
                                <input
                                    className={inputStyle}
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ej: Oferta Especial"
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelStyle}>Subtítulo</label>
                                <input
                                    className={inputStyle}
                                    value={formData.subtitle}
                                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                    placeholder="Descripción corta..."
                                />
                            </div>
                            <div>
                                <label className={labelStyle}>Tag (Etiqueta)</label>
                                <input
                                    className={inputStyle}
                                    value={formData.tag}
                                    onChange={e => setFormData({ ...formData, tag: e.target.value })}
                                    placeholder="Ej: Nuevo, Promo"
                                />
                            </div>
                            <div>
                                <label className={labelStyle}>Texto Botón</label>
                                <input
                                    className={inputStyle}
                                    value={formData.action_text}
                                    onChange={e => setFormData({ ...formData, action_text: e.target.value })}
                                    placeholder="Ej: Ver Más"
                                />
                            </div>
                            <div>
                                <label className={labelStyle}>Acción (URL o Función)</label>
                                <input
                                    className={inputStyle}
                                    value={formData.action_url}
                                    onChange={e => setFormData({ ...formData, action_url: e.target.value })}
                                    placeholder="Ej: #catalog"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className={labelStyle}>Activo:</span>
                                <div
                                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.active ? 'bg-green-500' : 'bg-gray-400'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.active ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => { setEditingId(null); resetForm(); }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-[#5B6236] text-white px-6 py-2 rounded hover:bg-[#3D2B1F] transition flex items-center gap-2"
                            >
                                <Save size={18} /> Guardar
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* List */}
            <div className="space-y-4">
                {slides.map((slide, index) => (
                    <div key={slide.id} className="border border-[#3D2B1F]/10 rounded p-4 flex items-center gap-4 bg-gray-50">
                        <div className="flex flex-col gap-1 text-[#3D2B1F]/50">
                            <button onClick={() => handleOrderChange(slide.id, -1)} disabled={index === 0} className="hover:text-[#C99A3A] disabled:opacity-30"><ArrowUp size={16} /></button>
                            <button onClick={() => handleOrderChange(slide.id, 1)} disabled={index === slides.length - 1} className="hover:text-[#C99A3A] disabled:opacity-30"><ArrowDown size={16} /></button>
                        </div>
                        <div className="w-24 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0 relative">
                            <Image src={typeof slide.image_url === 'string' ? slide.image_url.trim() : '/placeholder.jpg'} alt={slide.title} fill className="object-cover" />
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-[#3D2B1F]">{slide.title}</h3>
                                {slide.tag && <span className="text-[10px] bg-[#C99A3A] px-2 py-0.5 rounded text-white">{slide.tag}</span>}
                                {!slide.active && <span className="text-[10px] bg-gray-400 px-2 py-0.5 rounded text-white">Inactivo</span>}
                            </div>
                            <p className="text-sm text-gray-600 truncate">{slide.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setEditingId(slide.id); setFormData(slide); }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => handleDelete(slide.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {slides.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500 italic">No hay slides cargados.</div>
                )}
            </div>
        </div>
    );
};

export default CarouselManager;
