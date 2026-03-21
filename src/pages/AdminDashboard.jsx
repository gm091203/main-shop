import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';

const AdminDashboard = () => {
    const [activeChatCount, setActiveChatCount] = useState(0);
    const [userCount, setUserCount] = useState(0);
    const [totalNotificationCount, setTotalNotificationCount] = useState(0); // 주문 총 건수
    const [pendingOrderCount, setPendingOrderCount] = useState(0); // 입금 대기중 건수
    const [notifications, setNotifications] = useState([]); // 최근 주문 목록
    const [selectedNotification, setSelectedNotification] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // 1. 유저 수 실시간 감시
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            setUserCount(snapshot.size);
        });

        // 2. 안 읽은 채팅 고객 수 감시 (상담 관리용)
        const qChats = query(collection(db, 'chats'), where('sender', '==', 'user'), where('isRead', '==', false));
        const unsubscribeChats = onSnapshot(qChats, (snapshot) => {
            // 같은 유저의 메시지는 하나로 카운트해야 함
            const uniqueUsers = new Set();
            snapshot.forEach(doc => {
                uniqueUsers.add(doc.data().userId || doc.data().userName);
            });
            setActiveChatCount(uniqueUsers.size);
        });

        // 3. 최신 주문 및 통계 감시
        const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
            const ordersList = [];
            let pending = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                ordersList.push({ ...data, firebaseId: doc.id });
                if (data.status === '입금 대기중' || !data.status) {
                    pending++;
                }
            });
            setTotalNotificationCount(ordersList.length);
            setNotifications(ordersList.slice(0, 5));
            setPendingOrderCount(pending);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeChats();
            unsubscribeOrders();
        };
    }, []);

    return (
        <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '40px 20px', position: 'relative' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>관리자 대시보드</h1>
                        <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>ZEO'S SHOP 종합 관제 시스템</p>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                    {/* 실시간 채팅 알림 카드 */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid #334155',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: 'var(--primary)' }}></div>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#f8fafc' }}>새로운 문자가 왔을때</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>아직 읽지 않은 메시지가 있는 고객 수</p>

                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '24px' }}>
                            <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                                {activeChatCount}
                            </span>
                            <span style={{ fontSize: '1.1rem', color: '#94a3b8', paddingBottom: '6px' }}>명</span>
                        </div>

                        <div style={{ flex: 1 }}></div>

                        <Link to="/admin/chat" style={{
                            display: 'block',
                            textAlign: 'center',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            transition: 'opacity 0.2s'
                        }}>
                            상담 관리하기
                        </Link>
                    </div>

                    {/* 전체 회원 관리 카드 */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid #334155',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#10b981' }}></div>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#f8fafc' }}>전체 가입 회원</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>시스템에 등록된 총 사용자 수</p>

                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '24px' }}>
                            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                                {userCount}
                            </span>
                            <span style={{ fontSize: '1.1rem', color: '#94a3b8', paddingBottom: '6px' }}>명 등록됨</span>
                        </div>

                        <div style={{ flex: 1 }}></div>

                        <Link to="/admin/users" style={{
                            display: 'block',
                            textAlign: 'center',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            transition: 'opacity 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            고객 관리하기
                        </Link>
                    </div>

                    {/* 주문 관리 카드 */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid #334155',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#6366f1' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', margin: 0 }}>주문 관리 시스템</h2>
                            <span style={{ fontSize: '0.8rem', backgroundColor: '#334155', padding: '2px 8px', borderRadius: '12px', color: '#cbd5e1' }}>총 {totalNotificationCount}건 접수</span>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>입금 대기 중인 주문 및 최근 접수 목록</p>

                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '24px' }}>
                            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>
                                {pendingOrderCount}
                            </span>
                            <span style={{ fontSize: '1.1rem', color: '#94a3b8', paddingBottom: '6px' }}>건 입금 대기</span>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {notifications.length > 0 && notifications.map((noti, idx) => {
                                const isPending = noti.status === '입금 대기중' || (noti.message && noti.message.includes('대기'));
                                const statusText = noti.status || (isPending ? '입금 대기중' : '결제 기록');
                                const statusColor = isPending ? '#f59e0b' : '#10b981';

                                return (
                                    <div
                                        key={noti.id || idx}
                                        onClick={() => setSelectedNotification(noti)}
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.03)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            borderLeft: `3px solid ${statusColor}`,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ color: statusColor, fontWeight: 'bold' }}>{statusText}</span>
                                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                                {noti.createdAt ? new Date(noti.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : noti.time}
                                            </span>
                                        </div>
                                        <div style={{ color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {noti.orderSummaryTitle || noti.productName || noti.message}
                                        </div>
                                        {noti.finalPrice && (
                                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px', fontWeight: 'bold' }}>
                                                {noti.finalPrice.toLocaleString()}원
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <Link to="/admin/orders" style={{
                            display: 'block',
                            textAlign: 'center',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            transition: 'opacity 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            주문 관리하기
                        </Link>
                    </div>
                </div>
            </div>

            {/* Notification Detail Modal Overlay */}
            {selectedNotification && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setSelectedNotification(null)}
                >
                    <div
                        style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', width: '500px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', zIndex: 1001 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.4rem', color: 'white', margin: 0 }}>주문 상세 알림</h2>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{selectedNotification.time}</span>
                        </div>

                        {/* 주문 상품 정보 */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '12px', fontWeight: 600 }}>주문 상품 정보</h3>
                            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', fontSize: '0.95rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#94a3b8' }}>상품명</span>
                                    <span style={{ color: 'white', fontWeight: 500 }}>{selectedNotification.productName || '정보 없음'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#94a3b8' }}>상품 원가</span>
                                    <span style={{ color: '#cbd5e1' }}>{selectedNotification.productPrice?.toLocaleString() || 0}원</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#94a3b8' }}>할인 금액</span>
                                    <span style={{ color: '#ef4444' }}>-{selectedNotification.discountAmount?.toLocaleString() || 0}원</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px dashed #334155' }}>
                                    <span style={{ color: '#94a3b8', fontWeight: 500 }}>최종 결제 금액</span>
                                    <span style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 800 }}>{selectedNotification.finalPrice?.toLocaleString() || 0}원</span>
                                </div>
                            </div>
                        </div>

                        {/* 구매자 정보 */}
                        <div>
                            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '12px', fontWeight: 600 }}>구매자 정보</h3>
                            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', fontSize: '0.95rem' }}>
                                {selectedNotification?.userInfo ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr' }}>
                                            <span style={{ color: '#94a3b8' }}>이름</span>
                                            <span style={{ color: 'white' }}>{selectedNotification.userInfo?.name || '정보 없음'}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr' }}>
                                            <span style={{ color: '#94a3b8' }}>연락처</span>
                                            <span style={{ color: 'white' }}>{selectedNotification.userInfo?.phone || '미입력'}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr' }}>
                                            <span style={{ color: '#94a3b8' }}>배송지</span>
                                            <span style={{ color: 'white', lineHeight: 1.4 }}>{selectedNotification.userInfo?.address || ''} {selectedNotification.userInfo?.detailAddress || ''}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span style={{ color: '#94a3b8' }}>비회원 구매이거나 상세 정보가 없습니다. (채팅창에서 문의 필요)</span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedNotification(null)}
                            style={{ width: '100%', marginTop: '30px', padding: '14px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#475569'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#334155'}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
