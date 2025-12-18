"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import {
    LayoutGrid, DollarSign, TrendingUp, Truck, MapPin, Search,
    Package, ArrowRight, MessageCircle, AlertCircle, ShoppingBag,
    CheckCircle, X, Clock, Lock, BarChart3, AlertTriangle, Send,
    Plus, Edit, UploadCloud, Trash2, Save, Image as ImageIcon, Ticket, LogOut // Imported LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CarouselManager from '../../components/CarouselManager';
import RaffleManager from '../../components/RaffleManager';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('orders'); // orders, sent, metrics, products
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [loginError, setLoginError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Product Management State
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null); // Form data
    const [uploading, setUploading] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');

    // --- AUTHENTICATION ---
    useEffect(() => {
        // Check active session on mount
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
            setLoadingAuth(false);
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError(null);
        setLoadingAuth(true);

        const { error } = await supabase.auth.signInWithPassword({
            email: emailInput,
            password: passwordInput,
        });

        if (error) {
            setLoginError(error.message);
            setLoadingAuth(false);
        } else {
            // Success! 
            // The onAuthStateChange listener updates 'isAuthenticated',
            // but we must manually turn off the local loading state here.
            setLoadingAuth(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            // Fetch Orders
            const { data: oData } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (oData) setOrders(oData);

            // Fetch Products
            const { data: pData } = await supabase
                .from('products')
                .select('id, name, price, category, is_active, stock, legacy_id, image_url')
                .order('name');

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

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }

        const channel = supabase
            .channel('admin-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (isAuthenticated) fetchData();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [isAuthenticated]);

    // --- Actions ---
    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Optimistic update
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar estado");
        }
    };

    const handleToggleStock = async (productId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            const { error } = await supabase
                .from('products')
                .update({ is_active: newStatus })
                .eq('id', productId);

            if (error) throw error;

            // Optimistic update
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: newStatus } : p));
        } catch (error) {
            console.error("Error toggling stock:", error);
            alert("Error al actualizar stock");
        }
    };

    // --- Product Management Logic ---
    const handleNewClick = () => {
        setEditingProduct({
            legacy_id: '',
            name: '',
            price: '',
            stock: 0,
            category: 'Carne Vacuna',
            is_active: true,
            image_url: ''
        });
        setShowProductModal(true);
    };

    const handleEditClick = (product) => {
        setEditingProduct({
            id: product.id,
            legacy_id: product.legacy_id || '', // Ensure legacy_id exists in DB
            name: product.name,
            price: product.price,
            stock: product.stock || 0,
            category: product.category || 'General',
            is_active: product.is_active,
            image_url: product.image_url || ''
        });
        setShowProductModal(true);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            let imageUrl = editingProduct.image_url;

            // 1. Upload Image if changed
            if (editingProduct.file) {
                const file = editingProduct.file;
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            // 2. Prepare Data
            const productData = {
                legacy_id: editingProduct.legacy_id,
                name: editingProduct.name,
                price: parseFloat(editingProduct.price), // Ensure float
                stock: parseInt(editingProduct.stock) || 0,
                category: editingProduct.category,
                is_active: editingProduct.is_active,
                image_url: imageUrl
            };

            // 3. Insert or Update
            if (editingProduct.id) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
            }

            // 4. Refresh & Close
            await fetchData();
            setShowProductModal(false);
            alert("Producto guardado correctamente");

        } catch (error) {
            console.error("Error saving product:", error);
            alert("Error al guardar: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // --- Metrics / Analysis Logic ---
    const getMetrics = () => {
        // Sales Stats
        const salesMonth = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        const pending = orders.filter(o => o.status === 'pending').length;
        const avgTicket = orders.length ? salesMonth / orders.length : 0;

        // Rotation Analysis
        const productStats = {};

        // Init stats for all active products
        products.forEach(p => {
            productStats[p.name] = {
                id: p.id,
                name: p.name,
                category: p.category,
                price: p.price,
                soldQty: 0
            };
        });

        // Aggregate sales
        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    // Try exact match or find by name if product was deleted/renamed (resilience)
                    let stats = productStats[item.name];
                    if (!stats) return; // Product might be archived
                    stats.soldQty += (item.quantity || 0);
                });
            }
        });

        const statsArray = Object.values(productStats);
        const bestSellers = [...statsArray].sort((a, b) => b.soldQty - a.soldQty).slice(0, 5);
        const lowRotation = statsArray.filter(p => p.soldQty === 0);

        return { salesMonth, pending, avgTicket, bestSellers, lowRotation };
    };

    const metrics = getMetrics();

    // --- Helpers ---
    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(val);

    const handleWhatsApp = (phone) => {
        if (!phone) return;
        const link = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
        window.open(link, '_blank');
    };

    const filterList = (list) => {
        if (!searchTerm) return list;
        return list.filter(o =>
            o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.customer_phone?.includes(searchTerm)
        );
    };

    // --- RENDER ---
    if (loadingAuth) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-[#C99A3A]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div></div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-[#C99A3A] rounded-full flex items-center justify-center text-slate-900 shadow-lg">
                            <Lock size={32} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-[#F3E6D0] mb-6">Acceso Administrativo</h2>

                    {loginError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm text-center">
                            {loginError === 'Invalid login credentials' ? 'Credenciales incorrectas' : loginError}
                        </div>
                    )}

                    <input
                        type="email"
                        placeholder="Email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mb-4 focus:border-[#C99A3A] focus:outline-none"
                        autoFocus
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mb-6 focus:border-[#C99A3A] focus:outline-none"
                        required
                    />
                    <button disabled={loadingAuth} type="submit" className="w-full bg-[#C99A3A] hover:bg-[#b08530] text-slate-900 font-bold py-3 rounded-lg transition-colors uppercase tracking-wider flex justify-center">
                        {loadingAuth ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div> : 'Ingresar Seguro'}
                    </button>
                </form>
            </div>
        );
    }

    // Filtered Views
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const historyOrders = orders.filter(o => o.status !== 'pending');
    const filteredPending = filterList(pendingOrders);
    const filteredHistory = filterList(historyOrders);
    const currentList = activeTab === 'orders' ? filteredPending : (activeTab === 'sent' ? filteredHistory : []);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col print:bg-white print:text-black">

            {/* Global Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 0.5cm; }
                    body { background: white; color: black; }
                    .no-print, header, .kpi-cards, .list-panel, .actions-panel, .print-hide { display: none !important; }
                    .print-only { display: block !important; }
                    .detail-panel { 
                        position: relative !important; 
                        width: 100% !important; 
                        background: white !important; 
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .detail-content { color: black !important; padding: 0 !important; }
                    .detail-content * { color: black !important; border-color: #ddd !important; }
                    .bg-slate-800, .bg-slate-900, .bg-slate-950 { background: transparent !important; border: 1px solid #ddd !important; }
                    .text-slate-200, .text-slate-300, .text-slate-400, .text-slate-500 { color: black !important; }
                }
            `}</style>

            {/* Header */}
            <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-md z-10 gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 bg-[#C99A3A] rounded-lg flex items-center justify-center text-slate-900 font-bold shadow-lg">
                        <Truck size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[#F3E6D0]">Logística Mercado</h1>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                            Panel de Control <button onClick={handleLogout} className="text-red-400 hover:text-red-300 ml-2 underline flex items-center gap-1"><LogOut size={10} /> Salir</button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#C99A3A]"
                    />
                </div>

                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 w-full md:w-auto overflow-x-auto">
                    <button onClick={() => setActiveTab('orders')} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        <ShoppingBag size={16} /> Pendientes
                    </button>
                    <button onClick={() => setActiveTab('sent')} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sent' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Send size={16} /> Enviados
                    </button>
                    <button onClick={() => setActiveTab('metrics')} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'metrics' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        <TrendingUp size={16} /> Métricas
                    </button>
                    <button onClick={() => setActiveTab('products')} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Package size={16} /> Stock
                    </button>
                    <button onClick={() => setActiveTab('carousel')} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'carousel' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        <ImageIcon size={16} /> Carrusel
                    </button>
                    <button onClick={() => setActiveTab('raffles')} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'raffles' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Ticket size={16} /> Sorteos
                    </button>
                </div>
            </header>

            {/* Dashboard Content */}
            <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col gap-6 relative z-10">

                {/* KPI Cards */}
                {activeTab !== 'metrics' && activeTab !== 'products' && (
                    <div className="kpi-cards grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 shrink-0 no-print">
                        <div className="bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={48} /></div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Ventas Totales</p>
                            <h3 className="text-3xl font-black text-white">{formatCurrency(metrics.salesMonth)}</h3>
                        </div>
                        <div className="bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Package size={48} /></div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Pedidos Pendientes</p>
                            <h3 className={`text-3xl font-black ${metrics.pending > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{metrics.pending}</h3>
                        </div>
                        <div className="bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={48} /></div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Ticket Promedio</p>
                            <h3 className="text-3xl font-black text-white">{formatCurrency(metrics.avgTicket)}</h3>
                        </div>
                    </div>
                )}

                {/* ORDER VIEWS (PENDING & SENT) */}
                {(activeTab === 'orders' || activeTab === 'sent') && (
                    <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col md:flex-row print:bg-white print:shadow-none print:border-none">

                        {/* List - Hide on Print */}
                        <div className={`list-panel ${selectedOrder ? 'hidden md:flex' : 'flex'} flex-1 flex-col border-r border-slate-700 no-print`}>
                            <div className="p-4 border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
                                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                                    {activeTab === 'orders' ? <AlertCircle size={16} className="text-amber-500" /> : <CheckCircle size={16} className="text-emerald-500" />}
                                    {activeTab === 'orders' ? 'Pedidos Pendientes' : 'Historial Enviados'}
                                </h3>
                                <span className="text-xs text-slate-500">{currentList.length} pedidos</span>
                            </div>

                            {currentList.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8">
                                    <Package size={48} className="mb-4 opacity-20" />
                                    <p>No hay pedidos en esta sección.</p>
                                </div>
                            ) : (
                                <div className="overflow-y-auto flex-1 bg-slate-800">
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
                                            {currentList.map(order => (
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
                                                        <div className="flex items-center gap-1"><MapPin size={12} /> {order.delivery_address ? order.delivery_address.split(',')[1] : 'Rosario'}</div>
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-medium text-[#C99A3A] whitespace-nowrap">
                                                        {formatCurrency(order.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Detail Panel */}
                        <AnimatePresence mode='wait'>
                            {selectedOrder ? (
                                <motion.div
                                    key="detail"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="detail-panel w-full md:w-[450px] bg-slate-900 flex flex-col h-full absolute md:relative z-20 shadow-2xl"
                                >
                                    <div className="detail-content p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-start print:bg-white print:border-b-2 print:border-black">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">Pedido #{selectedOrder.id.slice(0, 8)}</h2>
                                            <p className="text-slate-400 text-sm flex items-center gap-2">
                                                <Clock size={14} /> {new Date(selectedOrder.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={handlePrint} className="no-print p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors" title="Imprimir Comprobante">
                                                <div className="flex items-center gap-2 px-2">
                                                    <span>🖨️</span>
                                                </div>
                                            </button>
                                            <button onClick={() => setSelectedOrder(null)} className="md:hidden p-2 text-slate-400 no-print"><X /></button>
                                        </div>
                                    </div>

                                    <div className="detail-content p-6 flex-1 overflow-y-auto space-y-8 print:overflow-visible">
                                        {/* Client Card */}
                                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 print:border print:border-black print:rounded-none">
                                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2"><Truck size={14} /> Datos de Entrega</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400 text-sm">Comercio:</span>
                                                    <span className="font-bold text-slate-200 text-right">{selectedOrder.customer_name?.split('(')[0]}</span>
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <span className="text-slate-400 text-sm">Dirección:</span>
                                                    <span className="font-medium text-slate-200 text-right max-w-[200px] text-sm">
                                                        {selectedOrder.delivery_address || 'Retira en local'}
                                                    </span>
                                                </div>

                                                {/* Embedded Map - Hide on Print */}
                                                {selectedOrder.delivery_address && (
                                                    <div className="mt-4 rounded-lg overflow-hidden border border-slate-700 shadow-inner h-40 bg-slate-900 relative group print-hide no-print">
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            frameBorder="0"
                                                            scrolling="no"
                                                            marginHeight="0"
                                                            marginWidth="0"
                                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedOrder.delivery_address + ', Santa Fe, Argentina')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                                            className="opacity-80 group-hover:opacity-100 transition-opacity"
                                                        ></iframe>
                                                        <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.delivery_address + ', Santa Fe, Argentina')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="absolute bottom-2 right-2 bg-slate-900/80 text-xs text-white px-2 py-1 rounded hover:bg-[#C99A3A] hover:text-slate-900 transition-colors flex items-center gap-1"
                                                        >
                                                            <MapPin size={10} /> Ampliar
                                                        </a>
                                                    </div>
                                                )}

                                                <div className="flex justify-between pt-2">
                                                    <span className="text-slate-400 text-sm">Teléfono:</span>
                                                    <span className="font-mono text-[#C99A3A] text-right">{selectedOrder.customer_phone}</span>
                                                </div>
                                                {selectedOrder.notes && (
                                                    <div className="pt-2 border-t border-slate-700 mt-2">
                                                        <span className="text-slate-400 text-xs block mb-1">Notas / CUIT:</span>
                                                        <span className="text-slate-300 text-sm italic">"{selectedOrder.notes}"</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleWhatsApp(selectedOrder.customer_phone)}
                                                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition-colors no-print"
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
                                            <div className="flex justify-between items-baseline text-xl font-bold text-[#C99A3A]">
                                                <span>Total</span>
                                                <span>{formatCurrency(selectedOrder.total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="actions-panel p-4 bg-slate-950 border-t border-slate-800 no-print">
                                        {/* Action Buttons */}
                                        {selectedOrder.status === 'pending' ? (
                                            <button
                                                onClick={() => handleUpdateStatus(selectedOrder.id, 'enviado')}
                                                className="w-full bg-[#C99A3A] hover:bg-[#b08530] text-slate-900 py-3 rounded-md font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg"
                                            >
                                                <CheckCircle size={18} /> Marcar como Enviado
                                            </button>
                                        ) : (
                                            <div className="text-center text-emerald-500 font-bold uppercase tracking-widest text-sm py-2 border border-emerald-500/30 bg-emerald-500/10 rounded-md">
                                                ✔ Pedido Enviado
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="hidden md:flex w-[450px] items-center justify-center text-slate-600 flex-col bg-slate-900 border-l border-slate-800">
                                    <Search size={48} className="mb-4 opacity-20" />
                                    <p>Selecciona un pedido para ver detalles</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* METRICS VIEW (ROTATION) */}
                {activeTab === 'metrics' && (
                    <div className="flex-1 overflow-auto p-0 space-y-6">

                        {/* Best Sellers */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-bold text-emerald-400 mb-6 flex items-center gap-2">
                                <TrendingUp size={24} /> Productos Más Vendidos (Top 5)
                            </h3>
                            <div className="space-y-4">
                                {metrics.bestSellers.map((p, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="flex justify-between text-sm mb-1 z-10 relative">
                                            <span className="font-bold text-slate-200">{idx + 1}. {p.name}</span>
                                            <span className="text-emerald-400 font-mono font-bold">{p.soldQty} unid.</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${(p.soldQty / (metrics.bestSellers[0]?.soldQty || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                                {metrics.bestSellers.length === 0 && <p className="text-slate-500 italic">No hay datos de ventas aún.</p>}
                            </div>
                        </div>

                        {/* Low Rotation Alert */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-bold text-red-400 mb-6 flex items-center gap-2">
                                <AlertTriangle size={24} /> Alerta: Baja Rotación (0 Ventas)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {metrics.lowRotation.map((p, idx) => (
                                    <div key={idx} className="bg-slate-900/50 p-4 rounded-lg border border-red-500/20 flex justify-between items-center group hover:bg-red-500/5 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-300 text-sm group-hover:text-red-300 transition-colors">{p.name}</p>
                                            <p className="text-xs text-slate-500 capitalize">{p.category}</p>
                                        </div>
                                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold">Sin Movimiento</span>
                                    </div>
                                ))}
                                {metrics.lowRotation.length === 0 && <p className="text-emerald-500 italic">¡Excelente! Todos los productos tienen movimiento.</p>}
                            </div>
                        </div>
                    </div>
                )}
                {/* PRODUCT MANAGEMENT VIEW */}
                {activeTab === 'products' && (
                    <div className="flex-1 overflow-auto p-0">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[#F3E6D0] flex items-center gap-2">
                                        <Package size={24} /> Gestión de Productos
                                    </h3>
                                    <p className="text-slate-400 text-sm">Administra tu inventario, precios y stock.</p>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar producto..."
                                            value={productSearchTerm}
                                            onChange={(e) => setProductSearchTerm(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#C99A3A]"
                                        />
                                    </div>
                                    <button
                                        onClick={handleNewClick}
                                        className="bg-[#C99A3A] hover:bg-[#b08530] text-slate-900 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-lg whitespace-nowrap"
                                    >
                                        <Plus size={18} /> Nuevo Producto
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).map(p => (
                                    <div key={p.id} className={`p-4 rounded-lg border flex flex-col gap-3 transition-all ${p.is_active ? 'bg-slate-900/50 border-slate-700' : 'bg-red-500/5 border-red-500/30'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className={`font-bold text-sm ${p.is_active ? 'text-slate-200' : 'text-slate-500 line-through'}`}>{p.name}</p>
                                                <p className="text-xs text-slate-500 capitalize">{p.category}</p>
                                                <p className="text-[#C99A3A] font-mono text-sm mt-1">{formatCurrency(p.price)}</p>
                                                <p className={`text-xs font-bold mt-1 ${p.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>Stock: {p.stock || 0}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditClick(p)}
                                                    className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStock(p.id, p.is_active)}
                                                    className={`w-10 h-5 rounded-full p-1 transition-colors flex items-center ${p.is_active ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                                                    title={p.is_active ? "Desactivar" : "Activar"}
                                                >
                                                    <div className="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {/* CAROUSEL MANAGEMENT VIEW */}
                {activeTab === 'carousel' && (
                    <div className="flex-1 overflow-auto p-0">
                        <CarouselManager />
                    </div>
                )}
                {/* RAFFLE MANAGEMENT VIEW */}
                {activeTab === 'raffles' && (
                    <div className="flex-1 overflow-auto p-0">
                        <RaffleManager />
                    </div>
                )}
            </div>

            {/* PRODUCT MODAL */}
            <AnimatePresence>
                {showProductModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 w-full max-w-lg rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">
                                    {editingProduct?.id ? 'Editar Producto' : 'Nuevo Producto'}
                                </h3>
                                <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white"><X /></button>
                            </div>

                            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Legacy ID</label>
                                        <input
                                            required
                                            type="text"
                                            value={editingProduct.legacy_id}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, legacy_id: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:border-[#C99A3A] focus:outline-none"
                                            placeholder="Ej: 001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                                        <select
                                            value={editingProduct.category}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:border-[#C99A3A] focus:outline-none"
                                        >
                                            <option value="Carne Vacuna">Carne Vacuna</option>
                                            <option value="Cerdo">Cerdo</option>
                                            <option value="Huevos">Huevos</option>
                                            <option value="Pollo">Pollo</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Producto</label>
                                    <input
                                        required
                                        type="text"
                                        value={editingProduct.name}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:border-[#C99A3A] focus:outline-none"
                                        placeholder="Ej: Costeleta Especial"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio (Usar punto)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                            <input
                                                required
                                                type="number"
                                                step="0.01"
                                                value={editingProduct.price}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-8 pr-4 text-white focus:border-[#C99A3A] focus:outline-none font-mono text-lg"
                                                placeholder="86277.65"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Disponible</label>
                                        <input
                                            required
                                            type="number"
                                            value={editingProduct.stock}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white focus:border-[#C99A3A] focus:outline-none font-mono text-lg"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">Precio Formato: 0000.00 (Ej: 86277.65)</p>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Imagen</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 cursor-pointer bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center hover:border-[#C99A3A] transition-colors group">
                                            <UploadCloud className="mb-2 text-slate-500 group-hover:text-[#C99A3A]" />
                                            <span className="text-xs text-slate-400 group-hover:text-white text-center">
                                                {editingProduct.file ? editingProduct.file.name : "Click para subir imagen"}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files[0]) {
                                                        setEditingProduct({ ...editingProduct, file: e.target.files[0] });
                                                    }
                                                }}
                                            />
                                        </label>
                                        {(editingProduct.image_url || editingProduct.file) && (
                                            <div className="w-20 h-20 rounded-lg border border-slate-700 overflow-hidden bg-slate-800 shrink-0 relative">
                                                <Image
                                                    src={editingProduct.file ? URL.createObjectURL(editingProduct.file) : (typeof editingProduct.image_url === 'string' ? editingProduct.image_url.trim() : "/placeholder.jpg")}
                                                    alt="Preview"
                                                    fill
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                                    <label className="text-sm font-bold text-slate-300 flex-1">Estado Activo</label>
                                    <button
                                        type="button"
                                        onClick={() => setEditingProduct({ ...editingProduct, is_active: !editingProduct.is_active })}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${editingProduct.is_active ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                                    >
                                        <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                                    </button>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowProductModal(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="flex-1 bg-[#C99A3A] hover:bg-[#b08530] text-slate-900 font-bold py-3 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} /> Guardar Producto
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Admin;
