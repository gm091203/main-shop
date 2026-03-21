import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const MyPage = () => {
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        name: '라이더',
        phone: '등록되지 않음',
        address: '등록되지 않음',
        detailAddress: ''
    });

    const [userOrders, setUserOrders] = useState([]);

    useEffect(() => {
        const fetchUserDataAndOrders = async () => {
            const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isLoggedIn') === 'true';

            if (!isLoggedIn) {
                alert('로그인이 필요한 서비스입니다.');
                navigate('/login');
                return;
            }

            const currentUserDataStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            if (currentUserDataStr) {
                const parsedData = JSON.parse(currentUserDataStr);
                setUserData({
                    name: parsedData.name || '라이더',
                    phone: parsedData.phone || '등록되지 않음',
                    address: parsedData.address || '등록되지 않음',
                    detailAddress: parsedData.detailAddress || '',
                    id: parsedData.id
                });

                // 내 주문 내역 불러오기 (최신 5건)
                try {
                    const q = query(
                        collection(db, 'orders'),
                        where('userInfo.id', '==', parsedData.id),
                        orderBy('createdAt', 'desc'),
                        limit(5)
                    );
                    const querySnapshot = await getDocs(q);
                    const myOrders = [];
                    querySnapshot.forEach((doc) => {
                        myOrders.push({ ...doc.data(), firebaseId: doc.id });
                    });
                    setUserOrders(myOrders);
                } catch (e) {
                    console.error('Failed to load user orders from Firestore:', e);
                    // Fallback for missing index
                    try {
                        const qBasic = query(
                            collection(db, 'orders'),
                            where('userInfo.id', '==', parsedData.id)
                        );
                        const snap = await getDocs(qBasic);
                        const orders = [];
                        snap.forEach(d => orders.push({ ...d.data(), firebaseId: d.id }));
                        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        setUserOrders(orders.slice(0, 5));
                    } catch (e2) {
                        console.error('Final fallback failed:', e2);
                    }
                }
            }
        };

        fetchUserDataAndOrders();
    }, [navigate]);

    return (
        <div className="container animate-fade-in" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h2 className="section-title">마이페이지</h2>

            <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--surface)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #D97706)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                    {userData.name ? userData.name[0] : 'R'}
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>반갑습니다, {userData.name}님!</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>ZEO'S SHOP 프리미엄 멤버십 회원입니다.</p>

                {/* 내 정보 영역 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px', color: 'var(--text-main)' }}>내 정보</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}><span style={{ color: 'var(--text-main)', display: 'inline-block', width: '80px', fontWeight: '500' }}>이름</span> {userData.name}</p>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}><span style={{ color: 'var(--text-main)', display: 'inline-block', width: '80px', fontWeight: '500' }}>전화번호</span> {userData.phone}</p>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}><span style={{ color: 'var(--text-main)', display: 'inline-block', width: '80px', fontWeight: '500' }}>주소</span> {userData.address} {userData.detailAddress}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left', marginBottom: '24px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>주문 내역</h4>
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>총 <span style={{ color: 'var(--primary)', marginLeft: '4px' }}>{userOrders.length}건</span></p>
                    </div>
                    <div
                        style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                        onClick={() => setIsCouponModalOpen(true)}
                    >
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>쿠폰</h4>
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>1장 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>(클릭)</span></p>
                    </div>
                </div>

                {/* 주문 내역 영역 추가 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px', color: 'var(--text-main)' }}>최근 주문 내역</h4>
                    {userOrders.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {userOrders.slice(0, 5).map(order => {
                                const orderDate = new Date(order.createdAt).toLocaleDateString('ko-KR');
                                const isCompleted = order.status === '입금완료';
                                return (
                                    <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{orderDate}</div>
                                            <div style={{ fontWeight: '500', color: 'var(--text-main)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                                                {order.orderSummaryTitle}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{order.finalPrice.toLocaleString()}원</div>
                                        </div>
                                        <div>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: isCompleted ? '#10b981' : '#f59e0b',
                                                border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                                            }}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>최근 주문 내역이 없습니다.</p>
                    )}
                </div>
                <div
                    style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    onClick={() => setIsCouponModalOpen(true)}
                >
                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>쿠폰</h4>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>1장 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>(클릭)</span></p>
                </div>
            </div>

            {/* 쿠폰 모달 */}
            {isCouponModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setIsCouponModalOpen(false)}>
                    <div style={{
                        background: 'var(--surface)', padding: '32px', borderRadius: '12px',
                        maxWidth: '400px', width: '100%', border: '1px solid var(--primary)',
                        boxShadow: '0 10px 25px rgba(234, 88, 12, 0.2)', textAlign: 'center', position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setIsCouponModalOpen(false)}
                            style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            &times;
                        </button>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text-main)' }}>내 쿠폰함</h3>

                        <div style={{
                            background: 'linear-gradient(135deg, #FF6B6B, var(--primary))',
                            padding: '24px', borderRadius: '8px', color: 'white', marginTop: '20px'
                        }}>
                            <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', fontWeight: 600 }}>ZEO'S SHOP 웰컴 쿠폰</h4>
                            <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-1px' }}>30%</div>
                            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>모든 라이딩 기어 카테고리 적용 가능</p>
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.4)', fontSize: '0.8rem', textAlign: 'right' }}>
                                유효기간: 발급일로부터 30일
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MyPage;
