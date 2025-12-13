import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    LayoutGrid, DollarSign, TrendingUp, Truck, MapPin, Search,
    Package, ArrowRight, MessageCircle, AlertCircle, ShoppingBag,
    CheckCircle, X, Clock, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('orders'); // orders, products
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (passwordInput === '45692278') { // Consider moving to env var or database
            setIsAuthenticated(true);
        } else {
            alert('Acceso Denegado');
        }
    };

    // --- Data Fetching ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 2. Fetch Orders (Tenant Scoped)
                const { data: oData } = await supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (oData) setOrders(oData);

                // 3. Fetch Products (Tenant Scoped)
                const { data: pData } = await supabase
                    .from('products')
                    .select('id, name, price, category, is_active')
                    .eq('is_active', true);

                if (pData) {
                    const normalized = pData.map(d => ({
                        ...d,
                        price: Number(d.price),
                        category: d.category || 'General'
                    }));
                    setProducts(normalized);
                }

            } catch (error) {
                console.error("Admin Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchData();
        }

        // Realtime Subscription
        const channel = supabase
            .channel('admin-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (isAuthenticated) fetchData();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [isAuthenticated]);

    // --- Metrics ---
    const getMetrics = () => {
        const salesMonth = orders.reduce((acc, o) => acc + (o.total || 0), 0);
        const pending = orders.filter(o => o.status === 'pending').length;
        const avgTicket = orders.length ? salesMonth / orders.length : 0;

        return { salesMonth, pending, avgTicket };
    };

    const metrics = getMetrics();

    // --- Helpers ---
    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(val);

    const getRecommendation = (prodName) => {
        const lower = prodName.toLowerCase();
        if (lower.includes('salame') || lower.includes('chorizo')) return { type: 'offer', text: '💡 Sugerencia: Pack Oferta (-5%)', color: 'text-yellow-400 bg-yellow-400/10' };
        if (lower.includes('bondiola') || lower.includes('costillar')) return { type: 'ok', text: '✅ Precio Competitivo', color: 'text-emerald-400 bg-emerald-400/10' };
        if (lower.includes('molleja')) return { type: 'trend', text: '📈 Tendencia Alta (Subir Precio)', color: 'text-purple-400 bg-purple-400/10' };
        return null;
    };

    const handleWhatsApp = (phone) => {
        if (!phone) return;
        const link = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
        window.open(link, '_blank');
    };

    // --- RENDER ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-[#C99A3A] rounded-full flex items-center justify-center text-slate-900 shadow-lg">
                            <Lock size={32} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-[#F3E6D0] mb-6">Acceso Restringido</h2>
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mb-4 focus:border-[#C99A3A] focus:outline-none"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full bg-[#C99A3A] hover:bg-[#b08530] text-slate-900 font-bold py-3 rounded-lg transition-colors uppercase tracking-wider"
                    >
                        Ingresar
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">

            {/* Header */}
            <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#C99A3A] rounded-lg flex items-center justify-center text-slate-900 font-bold shadow-lg">
                        <Truck size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[#F3E6D0]">Logística Mercado</h1>
                        <p className="text-xs text-slate-500">Panel de Control B2B</p>
                    </div>
                </div>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        Pedidos
                    </button>
                    <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        Productos + IA
                    </button>
                </div>
            </header>
            {/* Dashboard Content */}
            <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col gap-6 relative z-10">

                {/* KPI Cards - Stacked on Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 shrink-0">
                    <div className="bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={48} /></div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Ventas Totales</p>
                        <h3 className="text-3xl font-black text-white">{formatCurrency(metrics.salesMonth)}</h3>
                        <div className="h-1 w-full bg-slate-700 mt-4 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[70%]"></div></div>
                    </div>

                    <div className="bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Package size={48} /></div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Pedidos Pendientes</p>
                        <h3 className="text-3xl font-black text-white">{metrics.pending}</h3>
                        <div className="h-1 w-full bg-slate-700 mt-4 rounded-full overflow-hidden"><div className="h-full bg-amber-500 w-[40%]"></div></div>
                    </div>

                    <div className="bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp size={48} /></div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Ticket Promedio</p>
                        <h3 className="text-3xl font-black text-white">{formatCurrency(metrics.avgTicket)}</h3>
                        <div className="h-1 w-full bg-slate-700 mt-4 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[60%]"></div></div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <>
                        {/* Inbox List */}
                        <div className={`${selectedOrder ? 'hidden md:flex' : 'flex'} flex-1 flex-col border-r border-slate-700`}>
                            <div className="p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
                                <h3 className="font-bold text-slate-200 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Bandeja de Pedidos</h3>
                                <span className="text-xs text-slate-500">{orders.length} totales</span>
                            </div>
                            <div className="overflow-y-auto flex-1 bg-slate-800">
                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-900/50 text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                                            <tr>
                                                <th className="p-3 whitespace-nowrap">Estado</th>
                                                <th className="p-3 whitespace-nowrap">Cliente</th>
                                                <th className="p-3 hidden sm:table-cell whitespace-nowrap">Zona</th>
                                                <th className="p-3 text-right whitespace-nowrap">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50 text-sm">
                                            {orders.map(order => (
                                                <tr
                                                    key={order.id}
                                                    onClick={() => setSelectedOrder(order)}
                                                    className={`cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-[#C99A3A]/10 border-l-2 border-[#C99A3A]' : 'hover:bg-slate-700/50 border-l-2 border-transparent'}`}
                                                >
                                                    <td className="p-3 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                                            {order.status === 'pending' ? 'Pendiente' : order.status}
                                                        </span>
                                                        <div className="text-[10px] text-slate-500 mt-1">
                                                            {new Date(order.created_at).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap">
                                                        <div className="font-bold text-slate-200">{order.customer_name?.split('(')[0] || 'Cliente'}</div>
                                                        <div className="text-xs text-slate-500">{order.customer_phone || 'S/T'}</div>
                                                    </td>
                                                    <td className="p-3 hidden sm:table-cell text-slate-400 whitespace-nowrap">
                                                        <div className="flex items-center gap-1"><MapPin size={12} /> {order.customer_name?.match(/\((.*?)\)/)?.[1] || 'Rosario'}</div>
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-medium text-[#C99A3A] whitespace-nowrap">
                                                        {formatCurrency(order.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Detail Panel */}
                        <AnimatePresence mode='wait'>
                            {selectedOrder ? (
                                <motion.div
                                    key="detail"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="w-full md:w-[450px] bg-slate-900 flex flex-col h-full absolute md:relative z-20"
                                >
                                    <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">Pedido #{selectedOrder.id}</h2>
                                            <p className="text-slate-400 text-sm flex items-center gap-2">
                                                <Clock size={14} /> {new Date(selectedOrder.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <button onClick={() => setSelectedOrder(null)} className="md:hidden p-2 text-slate-400"><X /></button>
                                    </div>

                                    <div className="p-6 flex-1 overflow-y-auto space-y-8">
                                        {/* Client Card */}
                                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2"><Truck size={14} /> Datos de Entrega</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400 text-sm">Comercio:</span>
                                                    <span className="font-bold text-slate-200 text-right">{selectedOrder.customer_name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400 text-sm">Teléfono:</span>
                                                    <span className="font-mono text-[#C99A3A] text-right">{selectedOrder.customer_phone}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleWhatsApp(selectedOrder.customer_phone)}
                                                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <MessageCircle size={16} /> Contactar por WhatsApp
                                            </button>
                                        </div>

                                        {/* Items List */}
                                        <div>
                                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2"><ShoppingBag size={14} /> Productos ({selectedOrder.items?.length || 0})</h4>
                                            <ul className="space-y-3">
                                                {selectedOrder.items?.map((item, idx) => (
                                                    <li key={idx} className="flex justify-between items-start pb-3 border-b border-slate-800 last:border-0">
                                                        <div className="flex gap-3">
                                                            <span className="font-bold text-slate-300 w-6">{item.quantity}x</span>
                                                            <div>
                                                                <p className="text-slate-200 font-medium">{item.name}</p>
                                                                <p className="text-[10px] text-slate-500 capitalize">{item.category || 'Embutidos'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="font-mono text-slate-400 text-sm">
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Summary */}
                                        <div className="pt-4 border-t border-slate-700">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <span className="text-slate-400">Subtotal</span>
                                                <span className="text-slate-300">{formatCurrency(selectedOrder.total)}</span>
                                            </div>
                                            <div className="flex justify-between items-baseline text-xl font-bold text-[#C99A3A]">
                                                <span>Total</span>
                                                <span>{formatCurrency(selectedOrder.total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-950 border-t border-slate-800">
                                        {/* Action Buttons */}
                                        {selectedOrder.status === 'pending' && (
                                            <button className="w-full bg-[#C99A3A] hover:bg-[#b08530] text-slate-900 py-3 rounded font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                                                <CheckCircle size={18} /> Marcar como Enviado
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="hidden md:flex w-[450px] items-center justify-center text-slate-600 flex-col bg-slate-900 border-l border-slate-800">
                                    <Search size={48} className="mb-4 opacity-20" />
                                    <p>Selecciona un pedido para ver el detalle</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (
                    <div className="flex-1 overflow-auto p-0">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="p-4">Producto</th>
                                    <th className="p-4">Categoría</th>
                                    <th className="p-4 text-right">Precio Actual</th>
                                    <th className="p-4">IA Analysis 🤖</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {products.map(p => {
                                    const rec = getRecommendation(p.name);
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="p-4 font-medium text-slate-200">{p.name}</td>
                                            <td className="p-4 text-slate-400 text-sm capitalize">{p.category}</td>
                                            <td className="p-4 text-right font-mono text-[#C99A3A]">{formatCurrency(p.price)}</td>
                                            <td className="p-4">
                                                {rec && (
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${rec.color.replace('text-', 'border-').replace('bg-', 'border-opacity-20 ')} ${rec.color}`}>
                                                        {rec.text}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
