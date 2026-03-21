import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import './Checkout.css';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // 단일 상품(바로구매) 또는 장바구니 상품들 처리
    const checkoutItems = location.state?.items || (location.state?.product ? [{ ...location.state.product, quantity: location.state.product.quantity || 1 }] : []);

    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [isOrdered, setIsOrdered] = useState(false);

    // Mock coupons data
    const availableCoupons = [
        { id: 'welcome30', name: '신규 가입 웰컴 쿠폰', type: 'percent', value: 30, desc: '첫 구매 고객을 위한 특별 할인' }
    ];

    useEffect(() => {
        if (checkoutItems.length === 0) {
            alert('잘못된 접근입니다.');
            navigate('/');
        }
    }, [checkoutItems, navigate]);

    if (checkoutItems.length === 0) return null;

    // 상품 총 합계 계산 (할인 전)
    const subtotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleSelectCoupon = (coupon) => {
        if (selectedCoupon?.id === coupon.id) {
            setSelectedCoupon(null);
        } else {
            setSelectedCoupon(coupon);
        }
    };

    const calculateDiscount = () => {
        if (!selectedCoupon) return 0;
        if (selectedCoupon.type === 'percent') {
            return (subtotal * selectedCoupon.value) / 100;
        }
        return selectedCoupon.value;
    };

    const discount = calculateDiscount();
    const finalPrice = subtotal - discount;

    const handleCompletePayment = async () => {
        try {
            // Check both sessionStorage and localStorage for currentUser
            const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
            const userName = currentUser ? currentUser.name : '비회원';
            const orderId = Date.now().toString();

            // 주문 상품명 요약 생성 (예: '상품A 외 2건' 또는 '상품A')
            const orderSummaryTitle = checkoutItems.length > 1
                ? `${checkoutItems[0].name} 외 ${checkoutItems.length - 1}건`
                : checkoutItems[0].name;

            const newOrder = {
                id: orderId,
                userInfo: currentUser, // 전체 유저 정보
                items: checkoutItems, // 개별 상품 정보 (가격, 옵션, 수량)
                orderSummaryTitle: orderSummaryTitle,
                totalAmount: subtotal,
                discountAmount: discount,
                finalPrice: finalPrice,
                status: '입금 대기중', // 초기 상태: 입금 대기중
                createdAt: new Date().toISOString()
            };

            // 1. 주문 데이터 Firestore 저장
            await addDoc(collection(db, 'orders'), newOrder);

            // 2. 관리자 대시보드 알림용 Firestore 저장
            const newNotification = {
                id: orderId, // 주문 ID와 동일하게 설정
                orderId: orderId,
                type: 'ORDER',
                message: `${userName} 고객님이 ${finalPrice.toLocaleString()}원을 주문하셨습니다. (입금 대기)`,
                productName: orderSummaryTitle,
                productPrice: subtotal,
                discountAmount: discount,
                finalPrice: finalPrice,
                userInfo: currentUser,
                items: checkoutItems,
                time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'notifications'), newNotification);

            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Failed to save order/notification to Firestore:', error);
            alert('주문 처리 중 오류가 발생했습니다.');
            return;
        }

        setIsOrdered(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

                    {/* Coupon Section */}
                    <div className="checkout-section">
                        <h2 className="checkout-title">사용 가능 쿠폰</h2>
                        <div className="coupon-list">
                            {availableCoupons.map((coupon) => (
                                <div
                                    key={coupon.id}
                                    className={`coupon-card ${selectedCoupon?.id === coupon.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectCoupon(coupon)}
                                >
                                    <div className="coupon-info">
                                        <div className="coupon-badge">WELCOME</div>
                                        <h4>{coupon.name}</h4>
                                        <p>{coupon.desc}</p>
                                    </div>
                                    <div className="coupon-amount">
                                        {coupon.type === 'percent' ? `${coupon.value}%` : `${coupon.value.toLocaleString()}원`}
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
                        <div className="price-row discount">
                            <span>쿠폰 할인</span>
                            <span>-{discount.toLocaleString()}원</span>
                        </div>
                        <div className="price-row">
                            <span>배송비</span>
                            <span>무료</span>
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
                            {finalPrice.toLocaleString()}원 결제하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
