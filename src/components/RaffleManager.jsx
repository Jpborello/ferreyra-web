import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ticket, Plus, Trophy, Archive, AlertCircle, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

const RaffleManager = () => {
    const [raffles, setRaffles] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRaffle, setSelectedRaffle] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Animation/Winner State
    const [isDrawing, setIsDrawing] = useState(false);
    const [winner, setWinner] = useState(null);
    const [randomTicker, setRandomTicker] = useState('000');

    useEffect(() => {
        fetchRaffles();
    }, []);

    useEffect(() => {
        if (selectedRaffle) {
            fetchTickets(selectedRaffle.id);
        }
    }, [selectedRaffle]);

    const fetchRaffles = async () => {
        const { data } = await supabase.from('raffles').select('*').order('created_at', { ascending: false });
        if (data) {
            setRaffles(data);
            // Default to first active
            const active = data.find(r => r.status === 'active');
            if (active && !selectedRaffle) setSelectedRaffle(active);
        }
        setLoading(false);
    };

    const fetchTickets = async (raffleId) => {
        const { data } = await supabase.from('raffle_tickets').select('*').eq('raffle_id', raffleId);
        setTickets(data || []);
        // Check if there is already a winner
        const w = data?.find(t => t.is_winner);
        if (w) setWinner(w);
        else setWinner(null);
    };

    const createRaffle = async (title) => {
        const { error } = await supabase.from('raffles').insert([{ title, status: 'active' }]);
        if (error) alert(error.message);
        else {
            setShowCreateModal(false);
            fetchRaffles();
        }
    };

    const drawWinner = async () => {
        if (tickets.length === 0) return alert('No hay tickets para sortear.');
        if (!confirm('¿Iniciar sorteo?')) return;

        setIsDrawing(true);
        setWinner(null);

        // Animation Loop
        const interval = setInterval(() => {
            const random = tickets[Math.floor(Math.random() * tickets.length)];
            setRandomTicker(random.ticket_number);
        }, 100);

        // Decide Winner after 3 seconds
        setTimeout(async () => {
            clearInterval(interval);
            const winningTicket = tickets[Math.floor(Math.random() * tickets.length)];

            // Save to DB
            await supabase.from('raffle_tickets').update({ is_winner: true }).eq('id', winningTicket.id);
            await supabase.from('raffles').update({ winner_ticket_id: winningTicket.id, status: 'completed' }).eq('id', selectedRaffle.id);

            setWinner(winningTicket);
            setIsDrawing(false);
            fetchRaffles();
        }, 3000);
    };

    const archiveRaffle = async () => {
        if (!confirm('¿Archivar este sorteo? Ya no se verán los tickets en la lista principal.')) return;
        await supabase.from('raffles').update({ status: 'archived' }).eq('id', selectedRaffle.id);
        fetchRaffles();
        setSelectedRaffle(null);
    };

    // Calculate Grid
    const activeRaffles = raffles.filter(r => r.status !== 'archived');

    return (
        <div className="h-full flex flex-col">
            {winner && <Confetti recycle={false} numberOfPieces={500} />}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-[#F3E6D0] flex items-center gap-2">
                        <Ticket className="text-[#C99A3A]" /> Sorteos y Premios
                    </h3>
                    <p className="text-slate-400 text-sm">Gestioná tus eventos y sorteá ganadores en vivo.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#C99A3A] hover:bg-[#b08530] text-slate-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} /> Nuevo Sorteo
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                {/* Sidebar: List */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-900/50 border-b border-slate-700 font-bold text-slate-400 text-xs uppercase tracking-wider">
                        Sorteos Activos
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {activeRaffles.map(raffle => (
                            <button
                                key={raffle.id}
                                onClick={() => { setSelectedRaffle(raffle); setWinner(null); }}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedRaffle?.id === raffle.id
                                        ? 'bg-[#C99A3A]/10 border-[#C99A3A] text-[#C99A3A]'
                                        : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                <div className="font-bold">{raffle.title}</div>
                                <div className="text-xs opacity-70 flex justify-between mt-1">
                                    <span>{new Date(raffle.created_at).toLocaleDateString()}</span>
                                    <span className="uppercase">{raffle.status}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main: Details & Drawing */}
                <div className="md:col-span-2 bg-slate-800 rounded-xl border border-slate-700 flex flex-col relative overflow-hidden">
                    {selectedRaffle ? (
                        <>
                            <div className="p-6 border-b border-slate-700 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">{selectedRaffle.title}</h2>
                                    <div className="flex gap-4 text-sm text-slate-400">
                                        <span className="flex items-center gap-1"><Ticket size={14} /> {tickets.length} Participantes</span>
                                        <span className={`px-2 rounded text-[10px] font-bold uppercase border flex items-center ${selectedRaffle.status === 'active' ? 'border-emerald-500 text-emerald-500' : 'border-blue-500 text-blue-500'}`}>
                                            {selectedRaffle.status}
                                        </span>
                                    </div>
                                </div>
                                {selectedRaffle.status === 'completed' && (
                                    <button onClick={archiveRaffle} className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1">
                                        <Archive size={14} /> Archivar Sorteo
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-900/30">
                                {isDrawing ? (
                                    <div className="text-center scale-150 transform transition-all duration-75">
                                        <div className="text-6xl font-mono font-black text-[#C99A3A] animate-pulse">
                                            #{randomTicker}
                                        </div>
                                        <p className="text-slate-500 mt-4 animate-bounce">Buscando ganador...</p>
                                    </div>
                                ) : winner ? (
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="text-center bg-gradient-to-b from-[#C99A3A]/20 to-transparent p-10 rounded-2xl border border-[#C99A3A]/30"
                                    >
                                        <Trophy size={64} className="text-[#C99A3A] mx-auto mb-4" />
                                        <h3 className="text-xl text-[#F3E6D0] font-bold uppercase tracking-widest mb-2">¡Tenemos Ganador!</h3>
                                        <div className="text-6xl font-mono font-black text-white mb-4">#{winner.ticket_number}</div>
                                        <div className="bg-[#3D2B1F] text-[#C99A3A] px-6 py-2 rounded-full font-bold text-xl inline-block">
                                            {winner.customer_name}
                                        </div>
                                        <div className="mt-8 text-slate-500 text-sm">
                                            Ticket ID: {winner.id}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="text-center">
                                        {selectedRaffle.status === 'active' ? (
                                            <button
                                                onClick={drawWinner}
                                                disabled={tickets.length === 0}
                                                className="group relative bg-[#C99A3A] hover:bg-[#F3E6D0] text-[#3D2B1F] px-12 py-6 rounded-full font-black text-2xl uppercase tracking-widest shadow-[0_0_40px_rgba(201,154,58,0.3)] hover:shadow-[0_0_60px_rgba(201,154,58,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="relative z-10 flex items-center gap-3">
                                                    <Trophy className="animate-bounce" /> SORTEAR
                                                </span>
                                            </button>
                                        ) : (
                                            <div className="text-slate-500 flex flex-col items-center">
                                                <History size={48} className="mb-4 opacity-50" />
                                                <p>Este sorteo ya finalizó.</p>
                                            </div>
                                        )}
                                        {tickets.length === 0 && <p className="mt-4 text-slate-500">Esperando participantes...</p>}
                                    </div>
                                )}
                            </div>

                            {/* Ticket List Footer */}
                            <div className="h-48 bg-slate-950 border-t border-slate-800 p-4 overflow-y-auto">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 sticky top-0 bg-slate-950">Últimos Tickets</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {tickets.map(t => (
                                        <div key={t.id} className={`text-xs p-2 rounded border flex justify-between ${t.is_winner ? 'bg-[#C99A3A] text-[#3D2B1F] border-[#C99A3A] font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                                            <span className="truncate max-w-[100px]">{t.customer_name}</span>
                                            <span className="font-mono opacity-80">#{t.ticket_number}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600 flex-col">
                            <Ticket size={48} className="mb-4 opacity-20" />
                            <p>Seleccioná un sorteo o creá uno nuevo.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 w-full max-w-md rounded-xl border border-slate-700 shadow-2xl p-6"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Nuevo Sorteo</h3>
                            <form onSubmit={(e) => { e.preventDefault(); createRaffle(e.target.title.value); }}>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título del Evento</label>
                                    <input name="title" autoFocus required placeholder="Ej: Sorteo Día del Amigo" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-[#C99A3A] outline-none" />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white px-4 py-2">Cancelar</button>
                                    <button type="submit" className="bg-[#C99A3A] text-slate-900 font-bold px-6 py-2 rounded-lg hover:bg-[#b08530]">Crear</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RaffleManager;
