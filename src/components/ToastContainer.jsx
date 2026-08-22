"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info };
const STYLES = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-slate-800 text-white',
};

const ToastContainer = ({ toasts, onDismiss }) => (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
        <AnimatePresence>
            {toasts.map(t => {
                const Icon = ICONS[t.type] || Info;
                return (
                    <motion.div
                        key={t.id}
                        role="status"
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
                        className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-lg shadow-2xl text-sm font-medium ${STYLES[t.type] || STYLES.info}`}
                    >
                        <Icon size={18} className="shrink-0 mt-0.5" />
                        <span className="flex-1 leading-snug">{t.message}</span>
                        <button
                            onClick={() => onDismiss(t.id)}
                            className="opacity-70 hover:opacity-100 shrink-0"
                            aria-label="Cerrar notificación"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                );
            })}
        </AnimatePresence>
    </div>
);

export default ToastContainer;
