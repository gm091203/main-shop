import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

const AdminDashboard = () => {
    const [activeChatCount, setActiveChatCount] = useState(0);
    const [userCount, setUserCount] = useState(0);
    const [totalNotificationCount, setTotalNotificationCount] = useState(0); // 주문 총 건수
    const [pendingOrderCount, setPendingOrderCount] = useState(0); // 입금 대기중 건수
    const [notifications, setNotifications] = useState([]); // 최근 주문 목록
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            // 처음 로딩 시에만 true로 설정 (자동 갱신 시에는 깜빡임 방지)
            try {
                // 1. 유저 수 조회
                const userSnapshot = await getDocs(collection(db, 'users'));
                setUserCount(userSnapshot.size);

                // 2. 안 읽은 채팅 고객 수 조회 (인덱스 방지: 단일 필드 쿼리 후 메모리 필터링)
                const qChats = query(collection(db, 'chats'), where('isRead', '==', false));
                const chatSnapshot = await getDocs(qChats);
                const uniqueUsers = new Set();
                chatSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.sender === 'user') {
                        uniqueUsers.add(data.userId || data.userName);
                    }
                });
                setActiveChatCount(uniqueUsers.size);

                // 3. 최신 주문 및 통계 조회 (인덱스 방지)
                const qOrders = query(collection(db, 'orders'));
                const orderSnapshot = await getDocs(qOrders);
                const ordersList = [];
                orderSnapshot.forEach(doc => {
                    ordersList.push({ ...doc.data(), firebaseId: doc.id });
                });

                // 메모리에서 최신순 정렬
                ordersList.sort((a, b) => {
                    const tA = new Date(a.createdAt || 0).getTime();
                    const tB = new Date(b.createdAt || 0).getTime();
                    return (tB || 0) - (tA || 0);
                });

                let pending = 0;
                ordersList.forEach(data => {
                    if (data.status === '입금 대기중' || !data.status) {
                        pending++;
                    }
                });
                setTotalNotificationCount(ordersList.length);
                setNotifications(ordersList.slice(0, 5));
                setPendingOrderCount(pending);
            } catch (error) {
                console.error("Dashboard Fetch Error (V14):", error);
                if (error.code === 'permission-denied') {
                    console.warn("권한이 없습니다. (로그인 필요)");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        // 5초마다 자동 갱신 (선택 사항)
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
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
                            <span style={{ fontSize: isLoading ? '1.5rem' : '3.1rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                                {isLoading ? '로딩 중...' : activeChatCount}
                            </span>
                            {!isLoading && <span style={{ fontSize: '1.1rem', color: '#94a3b8', paddingBottom: '6px' }}>명</span>}
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
                            <span style={{ fontSize: isLoading ? '1.5rem' : '3.1rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                                {isLoading ? '로딩 중...' : userCount}
                            </span>
                            {!isLoading && <span style={{ fontSize: '1.1rem', color: '#94a3b8', paddingBottom: '6px' }}>명 등록됨</span>}
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
                                        {selectedNotification.items && selectedNotification.items.some(it => it.customAddress || it.detailAddress || it.idName) && (
                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #334155' }}>
                                                <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>아이템별 요청 정보:</span>
                                                {selectedNotification.items.map((it, idx) => (it.customAddress || it.detailAddress || it.idName) && (
                                                    <div key={idx} style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px', paddingLeft: '8px' }}>
                                                        <div style={{ fontWeight: 600 }}>• {it.name}</div>
                                                        {it.customAddress && <div style={{ color: 'var(--primary)', marginLeft: '12px' }}>주소: {it.customAddress} {it.specificAddress}</div>}
                                                        {it.idName ? (
                                                            <div style={{ color: '#94a3b8', marginLeft: '12px', whiteSpace: 'pre-wrap' }}>주민번호: {it.idName} | {it.idBirth} | {it.idAddress} | {it.idPhoto}</div>
                                                        ) : (
                                                            it.detailAddress && <div style={{ color: '#94a3b8', marginLeft: '12px', whiteSpace: 'pre-wrap' }}>상세: {it.detailAddress}</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
