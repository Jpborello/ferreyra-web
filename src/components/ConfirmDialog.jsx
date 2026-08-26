"use client";
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

// Modal de confirmacion generico para el panel de admin, para no usar el
// confirm() nativo del navegador (que rompe con el resto del diseño y
// bloquea el hilo). Cada pantalla que lo necesita guarda en un estado
// local que accion esta pendiente de confirmar y renderiza esto una sola
// vez, con open={!!esePendiente}.
const ConfirmDialog = ({
    open,
    title = 'Confirmar',
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    danger = false,
    onConfirm,
    onCancel,
}) => {
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-800 w-full max-w-sm rounded-xl border border-slate-700 shadow-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/10 text-red-400' : 'bg-[#C99A3A]/10 text-[#C99A3A]'}`}>
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">{title}</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-6">{message}</p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 bg-slate-900 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-lg transition-colors border border-slate-700"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className={`flex-1 font-bold py-2.5 rounded-lg transition-colors ${danger ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-[#C99A3A] hover:bg-[#b08530] text-slate-900'}`}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
