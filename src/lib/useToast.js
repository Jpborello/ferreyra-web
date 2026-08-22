"use client";
import { useState, useCallback, useRef } from 'react';

// Notificaciones simples en pantalla, para reemplazar los alert() nativos
// del navegador (que bloquean la UI y en mobile quedan feos). Se usa así:
//
//   const { toasts, showToast, dismissToast } = useToast();
//   ...
//   showToast('Producto guardado', 'success');
//   showToast('Error al guardar: ' + error.message, 'error');
//   <ToastContainer toasts={toasts} onDismiss={dismissToast} />

export function useToast() {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 4500) => {
        const id = ++idRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => dismissToast(id), duration);
        return id;
    }, [dismissToast]);

    return { toasts, showToast, dismissToast };
}
