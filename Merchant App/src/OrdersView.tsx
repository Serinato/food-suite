import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface OrdersViewProps {
    restaurantId: string;
}

export default function OrdersView({ restaurantId }: OrdersViewProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        const q = query(
            collection(db, 'orders'),
            where('restaurantId', '==', restaurantId),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(fetched);
            setLoading(false);
        }, (error) => {
            console.error("Firestore Orders Listener Error:", error);
            alert("Firestore Error: " + error.message);
            setLoading(false);
        });

        return () => unsub();
    }, [restaurantId]);

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Failed to update status");
        }
    };

    const statusColors: Record<string, string> = {
        'placed': '#f59e0b',      // yellow
        'confirmed': '#3b82f6',   // blue
        'preparing': '#8b5cf6',   // purple
        'on_way': '#ec4899',      // pink
        'delivered': '#10b981'    // green
    };

    const getStatusBg = (status: string) => statusColors[status] || '#888';

    if (loading) return <div style={{ padding: '20px' }}>Loading orders...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui' }}>
            <h2 style={{ marginBottom: '20px' }}>Recent Orders ({orders.length})</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
                {orders.map(order => (
                    <div key={order.id} style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f3f4f6' }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px' }}>Order #{order.id.slice(-4).toUpperCase()}</h3>
                                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <span style={{ padding: '6px 12px', background: `${getStatusBg(order.status)}20`, color: getStatusBg(order.status), borderRadius: '20px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', display: 'inline-block' }}>
                                    {order.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#374151' }}>Customer Info</h4>
                                <p style={{ margin: '0 0 5px', fontSize: '14px' }}><b>Name:</b> {order.customerInfo?.name}</p>
                                <p style={{ margin: '0 0 5px', fontSize: '14px' }}><b>Phone:</b> {order.customerInfo?.phone}</p>
                                <div style={{ marginTop: '10px' }}>
                                    <b style={{ fontSize: '14px' }}>Delivery Address:</b>
                                    <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#4b5563', lineHeight: '1.4' }}>
                                        {order.deliveryAddress?.flatNo && `${order.deliveryAddress.flatNo}, `}
                                        {order.deliveryAddress?.tower && `${order.deliveryAddress.tower}, `}
                                        {order.deliveryAddress?.googleAddress}
                                    </p>
                                </div>
                            </div>
                            <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#374151' }}>Order Items ({order.items?.length})</h4>
                                <div style={{ maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }}>
                                    {order.items?.map((item: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                                            <span style={{ color: '#4b5563' }}>1x {item.name}</span>
                                            <span style={{ fontWeight: '500' }}>₹{item.price}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                                    <span>Total</span>
                                    <span>₹{order.totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            {order.status === 'placed' && (
                                <button onClick={() => updateOrderStatus(order.id, 'confirmed')} style={{ flex: 1, padding: '12px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                                    Accept & Confirm Order
                                </button>
                            )}
                            {order.status === 'confirmed' && (
                                <button onClick={() => updateOrderStatus(order.id, 'preparing')} style={{ flex: 1, padding: '12px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                                    Start Preparing
                                </button>
                            )}
                            {order.status === 'preparing' && (
                                <button onClick={() => updateOrderStatus(order.id, 'on_way')} style={{ flex: 1, padding: '12px 20px', background: '#ec4899', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                                    Hand Over for Delivery
                                </button>
                            )}
                            {order.status === 'on_way' && (
                                <button onClick={() => updateOrderStatus(order.id, 'delivered')} style={{ flex: 1, padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                                    Mark as Delivered
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {orders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', color: '#6b7280' }}>
                        No orders found for this restaurant.
                    </div>
                )}
            </div>
        </div>
    );
}
