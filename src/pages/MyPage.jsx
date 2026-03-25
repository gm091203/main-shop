import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const MyPage = () => {
    const navigate = useNavigate();
    const [userOrders, setUserOrders] = useState([]);
    const [userData, setUserData] = useState({
        name: '',
        phone: '',
        address: '',
        detailAddress: '',
        id: ''
    });
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const fetchUserDataAndOrders = async () => {
        setIsDataLoading(true);
        setFetchError(null);
        
        try {
            const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isLoggedIn') === 'true';

            if (!isLoggedIn) {
                alert('로그인이 필요한 서비스입니다.');
                navigate('/login');
                return;
            }

            const currentUserDataStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            if (!currentUserDataStr || currentUserDataStr === 'undefined' || currentUserDataStr === 'null') {
                throw new Error("LOGIN_DATA_MISSING");
            }

            const parsedData = JSON.parse(currentUserDataStr);
            if (!parsedData || !parsedData.id) {
                throw new Error("INVALID_USER_ID");
            }

            // 초기 로컬 스토리지 데이터로 상태 설정
            setUserData({
                name: parsedData.name || '회원',
                phone: parsedData.phone || '등록되지 않음',
                address: parsedData.address || '등록되지 않음',
                detailAddress: parsedData.detailAddress || '',
                id: parsedData.id
            });

            // Firestore 작업들을 병렬로 실행하여 시간 단축 (최대 50% 성능 개선)
            await Promise.race([
                (async () => {
                    const tasks = [
                        // 태스크 1: 유저 정보 조회
                        (async () => {
                            try {
                                const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', parsedData.id)));
                                if (!userDoc.empty) {
                                    const actualData = userDoc.docs[0].data();
                                    if (actualData) {
                                        setUserData(prev => ({
                                            ...prev,
                                            ...actualData,
                                            firebaseId: userDoc.docs[0].id
                                        }));
                                    }
                                }
                            } catch (e) {
                                console.error("User doc fetch failed:", e);
                            }
                        })(),
                        
                        // 태스크 2: 주문 내역 조회
                        (async () => {
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
                                console.warn('Orders failover (index issues?):', e);
                                const qBasic = query(
                                    collection(db, 'orders'),
                                    where('userInfo.id', '==', parsedData.id)
                                );
                                const snap = await getDocs(qBasic);
                                const orders = [];
                                snap.forEach(d => orders.push({ ...d.data(), firebaseId: d.id }));
                                orders.sort((a, b) => {
                                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                                    return (dateB?.getTime?.() || 0) - (dateA?.getTime?.() || 0);
                                });
                                setUserOrders(orders.slice(0, 5));
                            }
                        })()
                    ];

                    await Promise.all(tasks);
                })(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 30000))
            ]);

        } catch (e) {
            console.error("MyPage data fetch failed:", e);
            if (e.message === "TIMEOUT") {
                setFetchError("네트워크 지연으로 정보를 불러오지 못했습니다. (V16-Timeout)");
            } else if (e.message === "LOGIN_DATA_MISSING" || e.message === "INVALID_USER_ID") {
                setFetchError("로그인 정보가 올바르지 않습니다. 다시 로그인해 주세요.");
                sessionStorage.clear();
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
            } else {
                setFetchError(`데이터 로드 결과: [${e.code || 'UNKNOWN'}] ${e.message}`);
            }
        } finally {
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        fetchUserDataAndOrders();
    }, []);

    // 1. 로딩 상태
    if (isDataLoading) {
        return (
            <div className="container" style={{ padding: '120px 20px', textAlign: 'center' }}>
                <div style={{ padding: '40px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--primary)', display: 'inline-block' }}>
                    <div className="animate-pulse" style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '16px' }}>회원 정보를 불러오는 중...</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>잠시만 기다려 주세요.</div>
                </div>
            </div>
        );
    }

    // 2. 오류 상태
    if (fetchError) {
        return (
            <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '400px', margin: '0 auto', padding: '32px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid #ef4444' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                    <h3 style={{ marginBottom: '16px', color: '#ef4444' }}>오류 발생</h3>
                    <p style={{ color: 'var(--text-main)', marginBottom: '24px', lineHeight: 1.5 }}>{fetchError}</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={() => fetchUserDataAndOrders()}>다시 시도</button>
                        <button className="btn btn-outline" style={{ padding: '10px 20px' }} onClick={() => navigate('/')}>홈으로 가기</button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. 정상 렌더링
    return (
        <div className="container animate-fade-in" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h2 className="section-title">마이페이지</h2>

            <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--surface)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #D97706)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                    {userData?.name ? userData.name[0] : 'R'}
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>반갑습니다, {userData?.name || '회원'}님!</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>ZEO'S SHOP 프리미엄 멤버십 회원입니다.</p>

                {/* 내 정보 영역 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px', color: 'var(--text-main)' }}>내 정보</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}><span style={{ color: 'var(--text-main)', display: 'inline-block', width: '80px', fontWeight: '500' }}>이름</span> {userData?.name || '미설정'}</p>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}><span style={{ color: 'var(--text-main)', display: 'inline-block', width: '80px', fontWeight: '500' }}>전화번호</span> {userData?.phone || '미설정'}</p>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}><span style={{ color: 'var(--text-main)', display: 'inline-block', width: '80px', fontWeight: '500' }}>주소</span> {userData?.address || '미설정'} {userData?.detailAddress || ''}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', textAlign: 'left', marginBottom: '24px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>주문 내역</h4>
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>총 <span style={{ color: 'var(--primary)', marginLeft: '4px' }}>{userOrders?.length || 0}건</span></p>
                    </div>
                </div>

                {/* 주문 내역 영역 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', textAlign: 'left', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px', color: 'var(--text-main)' }}>최근 주문 내역</h4>
                    {userOrders && userOrders.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {userOrders.slice(0, 5).map(order => {
                                let rawDate = null;
                                try {
                                    rawDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                                } catch(e) { console.warn("Date parse fail", e); }
                                
                                const orderDate = (!rawDate || isNaN(rawDate.getTime())) ? '날짜 정보 없음' : rawDate.toLocaleDateString('ko-KR');
                                const isCompleted = order.status === '입금완료';
                                return (
                                    <div key={order.firebaseId || Math.random()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{orderDate}</div>
                                            <div style={{ fontWeight: '500', color: 'var(--text-main)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                                                {order.orderSummaryTitle || '상품 정보 없음'}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{(order.finalPrice || 0).toLocaleString()}원</div>
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
                                                {order.status || '상태 알 수 없음'}
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
            </div>
        </div>
    );
};

export default MyPage;
