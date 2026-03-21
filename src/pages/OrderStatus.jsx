import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const OrderStatus = () => {
    const [userOrders, setUserOrders] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isLoggedIn') === 'true';

            if (!isLoggedIn) {
                alert('로그인이 필요한 서비스입니다.');
                navigate('/login');
                return;
            }

            const currentUserDataStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            if (currentUserDataStr) {
                const parsedData = JSON.parse(currentUserDataStr);
                const userId = parsedData.id; // user id from firestore document

                try {
                    // Firestore에서 현재 유저의 주문 내역만 가져오기
                    const q = query(
                        collection(db, 'orders'),
                        where('userInfo.id', '==', userId),
                        orderBy('createdAt', 'desc')
                    );
                    
                    const querySnapshot = await getDocs(q);
                    const myOrders = [];
                    querySnapshot.forEach((doc) => {
                        myOrders.push({ ...doc.data(), firebaseId: doc.id });
                    });

                    setUserOrders(myOrders);
                } catch (e) {
                    console.error('Failed to load user orders from Firestore:', e);
                    // 만약 index가 없어서 에러나면 fallback 처리 (where만 쓰고 메모리에서 정렬)
                    try {
                        const qBasic = query(
                            collection(db, 'orders'),
                            where('userInfo.id', '==', userId)
                        );
                        const snap = await getDocs(qBasic);
                        const orders = [];
                        snap.forEach(d => orders.push({ ...d.data(), firebaseId: d.id }));
                        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        setUserOrders(orders);
                    } catch (e2) {
                        console.error('Final fallback failed:', e2);
                    }
                }
            }
        };

        fetchOrders();
    }, [navigate]);

    return (
        <div className="container animate-fade-in" style={{ padding: '60px 20px', textAlign: 'center', minHeight: '80vh' }}>
            <h2 className="section-title">주문/배송 진행상태</h2>

            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
                    <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '8px' }}>
                            {userOrders.length}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>전체 주문</div>
                    </div>
                    <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#f59e0b', marginBottom: '8px' }}>
                            {userOrders.filter(o => o.status === '입금 대기중' || !o.status).length}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>입금 대기중</div>
                    </div>
                    <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>
                            {userOrders.filter(o => o.status === '입금완료').length}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>결제 완료</div>
                    </div>
                    <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#38bdf8', marginBottom: '8px' }}>
                            {userOrders.filter(o => o.status === '배송중').length}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>배송중</div>
                    </div>
                </div>

                <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>주문 상세 내역</h3>

                    {userOrders.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {userOrders.map(order => {
                                const orderDate = new Date(order.createdAt).toLocaleString('ko-KR');
                                const status = order.status || '입금 대기중';
                                const isCompleted = status === '입금완료';
                                const isInTransit = status === '배송중';

                                return (
                                    <div key={order.id} style={{
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px',
                                        padding: '24px',
                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>주문일시: {orderDate}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>주문번호: {order.id}</div>
                                                <h4 style={{ fontSize: '1.2rem', margin: '0 0 8px 0', color: 'white' }}>{order.orderSummaryTitle}</h4>
                                                <div style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{order.finalPrice.toLocaleString()}원</div>
                                            </div>
                                            <div>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 'bold',
                                                    backgroundColor: isInTransit ? 'rgba(56, 189, 248, 0.1)' : isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: isInTransit ? '#38bdf8' : isCompleted ? '#10b981' : '#f59e0b',
                                                    border: `1px solid ${isInTransit ? 'rgba(56, 189, 248, 0.3)' : isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                                    marginBottom: '12px'
                                                }}>
                                                    {status}
                                                </span>
                                                {status === '입금 대기중' && (
                                                    <div style={{
                                                        background: 'rgba(245, 158, 11, 0.05)',
                                                        border: '1px solid rgba(245, 158, 11, 0.2)',
                                                        borderRadius: '6px',
                                                        padding: '12px',
                                                        fontSize: '0.85rem',
                                                        color: 'var(--text-main)'
                                                    }}>
                                                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#f59e0b' }}>입금 안내</div>
                                                        <div>은행: 안전은행</div>
                                                        <div>계좌: 123-456-789012</div>
                                                        <div>예금주: (주)제오스샵</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 구매한 상세 품목 리스트 */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '6px', padding: '16px' }}>
                                            <h5 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>구매 상품 상세</h5>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {order.items && order.items.map((item, idx) => (
                                                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                        <span style={{ color: '#cbd5e1' }}>{item.name}</span>
                                                        <span>
                                                            <span style={{ color: 'var(--text-muted)', marginRight: '16px' }}>{item.quantity}개</span>
                                                            <span style={{ fontWeight: '500' }}>{(item.price * item.quantity).toLocaleString()}원</span>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>📦</div>
                            <p>진행 중인 주문 내역이 없습니다.</p>
                            <button
                                onClick={() => navigate('/')}
                                className="btn btn-outline"
                                style={{ marginTop: '24px' }}
                            >
                                쇼핑하러 가기
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderStatus;
