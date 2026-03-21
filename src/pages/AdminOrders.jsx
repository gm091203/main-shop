import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ordersData = [];
            querySnapshot.forEach((doc) => {
                ordersData.push({ ...doc.data(), firebaseId: doc.id });
            });
            setOrders(ordersData);
        }, (error) => {
            console.error("Error fetching orders:", error);
        });

        return () => unsubscribe();
    }, []);

    const handleChangeStatus = async (orderFirebaseId, newStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderFirebaseId);
            await updateDoc(orderRef, { status: newStatus });

            // 시스템 알림(Notification) 추가
            const targetOrder = orders.find(o => o.firebaseId === orderFirebaseId);
            const newNoti = {
                id: Date.now().toString(),
                type: 'SYSTEM',
                message: `주문(${targetOrder.orderSummaryTitle}) 상태가 '${newStatus}'(으)로 변경되었습니다.`,
                time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                createdAt: new Date().toISOString()
            };
            
            await addDoc(collection(db, 'notifications'), newNoti);

        } catch (error) {
            console.error('Failed to update order status:', error);
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    };

    const handleDeleteOrder = async (orderFirebaseId) => {
        if (!window.confirm('정말 이 주문 내역을 삭제하시겠습니까? (복구할 수 없습니다)')) return;

        try {
            await deleteDoc(doc(db, 'orders', orderFirebaseId));
        } catch (error) {
            console.error('Failed to delete order:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    return (
        <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '40px 20px', position: 'relative' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Link to="/admin" style={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            color: '#94a3b8',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '600'
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.borderColor = '#475569'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5"></path>
                                <path d="M12 19l-7-7 7-7"></path>
                            </svg>
                            대시보드로 돌아가기
                        </Link>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>주문 관리</h1>
                            <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>모든 고객의 주문 내역 및 입금 상태 확인</p>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.length === 0 ? (
                        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94a3b8', border: '1px solid #334155' }}>
                            아직 접수된 주문이 없습니다.
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} style={{
                                backgroundColor: '#1e293b',
                                borderRadius: '12px',
                                border: '1px solid #334155',
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
                                    <div>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>주문번호: {order.id}</span>
                                        <h3 style={{ fontSize: '1.2rem', color: 'white', margin: '4px 0 0' }}>{order.orderSummaryTitle}</h3>
                                        <p style={{ color: 'var(--primary)', fontWeight: 'bold', margin: '4px 0 0' }}>{order.finalPrice.toLocaleString()}원</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            backgroundColor: order.status === '배송중' ? 'rgba(56, 189, 248, 0.1)' : order.status === '입금완료' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: order.status === '배송중' ? '#38bdf8' : order.status === '입금완료' ? '#10b981' : '#f59e0b',
                                            border: `1px solid ${order.status === '배송중' ? 'rgba(56, 189, 248, 0.3)' : order.status === '입금완료' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                                        }}>
                                            {order.status}
                                        </div>

                                        {/* 입금 대기중 -> 입금완료 */}
                                        {(order.status === '입금 대기중' || !order.status) && (
                                            <button
                                                onClick={() => handleChangeStatus(order.firebaseId, '입금완료')}
                                                style={{
                                                    backgroundColor: 'var(--primary)',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    transition: 'opacity 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                                onMouseLeave={(e) => e.target.style.opacity = '1'}
                                            >
                                                입금 확인
                                            </button>
                                        )}

                                        {/* 입금완료 -> 배송중 OR 입금 대기중으로 되돌리기 */}
                                        {order.status === '입금완료' && (
                                            <>
                                                <button
                                                    onClick={() => handleChangeStatus(order.firebaseId, '배송중')}
                                                    style={{
                                                        backgroundColor: '#0ea5e9',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        transition: 'opacity 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                                                >
                                                    배송 시작
                                                </button>
                                                <button
                                                    onClick={() => handleChangeStatus(order.firebaseId, '입금 대기중')}
                                                    style={{
                                                        backgroundColor: 'transparent',
                                                        color: '#94a3b8',
                                                        border: '1px solid #475569',
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => { e.target.style.color = '#f8fafc'; e.target.style.borderColor = '#64748b'; }}
                                                    onMouseLeave={(e) => { e.target.style.color = '#94a3b8'; e.target.style.borderColor = '#475569'; }}
                                                >
                                                    입금 취소
                                                </button>
                                            </>
                                        )}

                                        {/* 배송중 -> 입금완료로 되돌리기 */}
                                        {order.status === '배송중' && (
                                            <button
                                                onClick={() => handleChangeStatus(order.firebaseId, '입금완료')}
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    color: '#94a3b8',
                                                    border: '1px solid #475569',
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => { e.target.style.color = '#f8fafc'; e.target.style.borderColor = '#64748b'; }}
                                                onMouseLeave={(e) => { e.target.style.color = '#94a3b8'; e.target.style.borderColor = '#475569'; }}
                                            >
                                                배송 취소
                                            </button>
                                        )}

                                        {/* 주문 삭제 버튼 */}
                                        <button
                                            onClick={() => handleDeleteOrder(order.firebaseId)}
                                            style={{
                                                backgroundColor: 'transparent',
                                                color: '#ef4444',
                                                border: '1px solid #ef4444',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                                            onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                                        >
                                            배송(주문) 삭제
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                    <div>
                                        <h4 style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>구매자 정보</h4>
                                        {order.userInfo ? (
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <li><span style={{ display: 'inline-block', width: '60px', color: '#64748b' }}>이름:</span> {order.userInfo.name}</li>
                                                <li><span style={{ display: 'inline-block', width: '60px', color: '#64748b' }}>연락처:</span> {order.userInfo.phone}</li>
                                                <li><span style={{ display: 'inline-block', width: '60px', color: '#64748b' }}>배송지:</span> {order.userInfo.address} {order.userInfo.detailAddress}</li>
                                            </ul>
                                        ) : (
                                            <span>비회원 구매</span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>주문 일시</h4>
                                        <p style={{ margin: 0 }}>{new Date(order.createdAt).toLocaleString('ko-KR')}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;
