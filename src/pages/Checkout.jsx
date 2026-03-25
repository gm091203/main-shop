import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import './Checkout.css';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // 단일 상품(바로구매) 또는 장바구니 상품들 처리
    const checkoutItems = location.state?.items || (location.state?.product ? [{ ...location.state.product, quantity: location.state.product.quantity || 1 }] : []);

    const [isOrdered, setIsOrdered] = useState(false);

    useEffect(() => {
        if (checkoutItems.length === 0) {
            alert('잘못된 접근입니다.');
            navigate('/');
            return;
        }
    }, [checkoutItems, navigate]);

    if (checkoutItems.length === 0) return null;

    // 상품 총 합계 계산 (할인 전)
    const subtotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const deliveryFee = 5000;
    const finalPrice = subtotal + deliveryFee;

    const handleCompletePayment = async () => {
        const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
        const userName = currentUser ? currentUser.name : '비회원';
        const orderId = Date.now().toString();

        const orderSummaryTitle = checkoutItems.length > 1
            ? `${checkoutItems[0].name} 외 ${checkoutItems.length - 1}건`
            : checkoutItems[0].name;

        const newOrder = {
            id: orderId,
            userInfo: currentUser,
            items: checkoutItems,
            orderSummaryTitle: orderSummaryTitle,
            totalAmount: subtotal,
            discountAmount: 0,
            finalPrice: finalPrice,
            status: '입금 대기중',
            createdAt: new Date().toISOString()
        };

        const newNotification = {
            id: orderId,
            orderId: orderId,
            type: 'ORDER',
            message: `${userName} 고객님이 ${finalPrice.toLocaleString()}원을 주문하셨습니다. (입금 대기)`,
            productName: orderSummaryTitle,
            productPrice: subtotal,
            discountAmount: 0,
            finalPrice: finalPrice,
            userInfo: currentUser,
            items: checkoutItems,
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString()
        };

        try {
            // 10초 타임아웃 적용
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('TIMEOUT_ERROR')), 10000);
            });

            // 주문과 알림 동시 저장
            const tasks = [
                addDoc(collection(db, 'orders'), newOrder),
                addDoc(collection(db, 'notifications'), newNotification)
            ];

            await Promise.race([
                Promise.all(tasks),
                timeoutPromise
            ]);

            window.dispatchEvent(new Event('storage'));
            setIsOrdered(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Failed to save order/notification (V19):', error);
            const errorMsg = error.message === 'TIMEOUT_ERROR' 
                ? '서버 응답 시간이 초과되었습니다. (네트워크 연결을 확인하세요)' 
                : `주문 처리 실패: ${error.code || error.message}`;
            alert(`[오류 V19] ${errorMsg}`);
        }
    };

    if (isOrdered) {
        return (
            <div className="checkout-container animate-fade-in" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <div className="checkout-section" style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✅</div>
                    <h1 className="checkout-title" style={{ fontSize: '2rem' }}>주문이 접수되었습니다!</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>아래 계좌로 입금해 주시면 확인 후 배송이 시작됩니다.</p>

                    <div className="account-info" style={{ backgroundColor: 'rgba(234, 88, 12, 0.05)', textAlign: 'left', marginBottom: '32px' }}>
                        <div className="price-row" style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '20px' }}>
                            <span>입금하실 금액</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{finalPrice.toLocaleString()}원</span>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                            <p style={{ fontSize: '1rem', marginBottom: '8px' }}>은행: **안전은행**</p>
                            <p style={{ fontSize: '1rem', marginBottom: '8px' }}>계좌: **123-456-789012**</p>
                            <p style={{ fontSize: '1rem' }}>예금주: **(주)제오스샵**</p>
                        </div>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', padding: '16px' }} onClick={() => navigate('/')}>
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-container animate-fade-in">
            <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '32px' }}>주문/결제</h1>

            <div className="checkout-grid">
                <div className="checkout-left">
                    {/* Product Summary */}
                    <div className="checkout-section">
                        <h2 className="checkout-title">주문 상품 정보 ({checkoutItems.length})</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {checkoutItems.map((item, idx) => (
                                <div key={idx} className="product-summary" style={{ borderBottom: idx === checkoutItems.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', paddingBottom: idx === checkoutItems.length - 1 ? 0 : '16px' }}>
                                    <div className="product-summary-image" style={{ backgroundColor: item.color }}>
                                        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>IMG</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.name}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>수량: {item.quantity}개</p>
                                            <p style={{ fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString()}원</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="checkout-section">
                        <h2 className="checkout-title">결제 안내</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            현재 무통장 입금 결제만 가능합니다. <br />
                            하단의 <strong>결제하기</strong> 버튼을 누르시면 입금하실 계좌 번호를 확인하실 수 있습니다.
                        </p>
                    </div>
                </div>

                <div className="checkout-right">
                    {/* Price Calculation Card */}
                    <div className="checkout-section" style={{ position: 'sticky', top: '100px' }}>
                        <h2 className="checkout-title">최종 결제 금액</h2>
                        <div className="price-row">
                            <span>상품 총 금액</span>
                            <span>{subtotal.toLocaleString()}원</span>
                        </div>
                        <div className="price-row">
                            <span>배송비</span>
                            <span>{deliveryFee.toLocaleString()}원</span>
                        </div>
                        <div className="price-row total" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                            <span>총 결제 금액</span>
                            <span style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>{finalPrice.toLocaleString()}원</span>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '24px', padding: '16px', fontSize: '1.1rem' }}
                            onClick={handleCompletePayment}
                        >
                            {finalPrice.toLocaleString()}원 결제하기 (V19)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
