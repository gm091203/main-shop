import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [agreed, setAgreed] = useState(false);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (checkoutItems.length === 0) {
            alert('잘못된 접근입니다.');
            navigate('/');
            return;
        }
    }, [checkoutItems, navigate]);

    // 배송 모달 오픈 시 배경 스크롤 방지
    useEffect(() => {
        if (showDeliveryModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showDeliveryModal]);

    if (checkoutItems.length === 0) return null;

    // 상품 총 합계 계산 (할인 전)
    const subtotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const deliveryFee = 5000;
    const finalPrice = subtotal + deliveryFee;

    const handleCompletePayment = () => {
        if (!agreed) {
            alert('구매 이용 가이드 및 환불 제한에 대한 경고문에 동의하셔야 결제가 가능합니다.');
            return;
        }
        setShowDeliveryModal(true);
    };

    const handleConfirmOrder = async () => {
        setIsProcessing(true);
        setShowDeliveryModal(false);

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
            console.error('Failed to save order/notification (V21):', error);
            const errorMsg = error.message === 'TIMEOUT_ERROR' 
                ? '서버 응답 시간이 초과되었습니다. (네트워크 연결을 확인하세요)' 
                : `주문 처리 실패: ${error.code || error.message}`;
            alert(`[오류 V21] ${errorMsg}`);
        } finally {
            setIsProcessing(false);
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
                                        {(item.customAddress || item.detailAddress || item.idName) && (
                                            <div style={{ marginTop: '8px', padding: '10px', backgroundColor: 'rgba(234, 88, 12, 0.05)', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                                                {item.customAddress && (
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                                                        <strong style={{ color: 'var(--primary)' }}>배송 주소:</strong> {item.customAddress} {item.specificAddress}
                                                    </p>
                                                )}
                                                {(item.detailAddress || item.idName) && (
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', wordBreak: 'break-all', marginTop: item.customAddress ? '4px' : '0' }}>
                                                        {item.idName ? (
                                                            <>
                                                                <strong style={{ color: '#94a3b8' }}>주민번호 정보:</strong> {item.idName} / {item.idBirth} / {item.idAddress} / {item.idPhoto || '사진 없음'}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <strong style={{ color: '#94a3b8' }}>상세 정보:</strong> {item.detailAddress}
                                                            </>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        )}
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

                        {/* [구매 이용 가이드 및 환불 제한에 대한 경고문] */}
                        <div style={{
                            marginTop: '24px',
                            padding: '20px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            color: '#475569',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            lineHeight: '1.7',
                            textAlign: 'left',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            <h4 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '16px', fontSize: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                                [구매 이용 가이드 및 환불 제한에 대한 경고문]
                            </h4>
                            <p style={{ marginBottom: '16px', fontWeight: 500 }}>
                                본 서비스에서 상품을 구매하시는 고객님께서는 원활한 거래를 위해 아래의 <strong>[구매 및 환불 주의사항]</strong>을 반드시 확인해 주시기 바랍니다.
                            </p>
                            
                            <div style={{ marginBottom: '16px' }}>
                                <strong style={{ color: '#1e293b', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>1. 구매 시 주의사항</strong>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    <li style={{ marginBottom: '4px' }}>• <strong>배송 정보 확인:</strong> 고객님의 입력 오류로 인한 오배송 및 사고에 대한 책임은 구매자에게 있습니다.</li>
                                    <li>• <strong>추가 요금 안내:</strong> 
                                        <ul style={{ paddingLeft: '14px', marginTop: '4px', listStyle: 'circle' }}>
                                            <li>제주도 및 도서산간 지역은 별도의 <strong>특수 지역 배송비</strong>가 발생합니다.</li>
                                            <li>설치가 필요한 대형 가전/가구 등의 경우 현장 상황에 따라 <strong>추가 공임비(사다리차 등)</strong>가 청구될 수 있습니다.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <strong style={{ color: '#1e293b', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>2. 환불에 대한 주의사항</strong>
                                <p>• <strong>구매한 상품에 대한 청약 철회:</strong> 상품 특성상 [1:1 주문 제작 / 재판매가 불가능한 소모성 자재 / 개봉 시 가치가 훼손되는 상품] 청약철회(환불)은 불가 합니다. 구매전 꼼꼼한 상품 확인과 배송지 확인 부탁드립니다.</p>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <strong style={{ color: '#1e293b', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>. 부정 행위 및 법적 책임</strong>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    <li style={{ marginBottom: '4px' }}>• <strong>상습 반품 및 업무 방해:</strong> 정당한 사유 없는 상습적인 반품이나 허위 리뷰 작성으로 업무를 방해할 경우 서비스 이용이 제한될 수 있습니다.</li>
                                    <li>• <strong>저작권 침해:</strong> 사이트 내 이미지와 콘텐츠를 무단 복제 및 상업적으로 이용하는 행위는 법적 처벌 대상입니다.</li>
                                </ul>
                            </div>

                            <p style={{ marginTop: '12px', fontWeight: 700, color: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.05)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #dc2626' }}>
                                ※ 환불 불가 규정을 인지하지 못해 발생하는 불이익에 대해서는 판매자가 책임지지 않으며, 부당한 요구 시 법적 조치가 취해질 수 있습니다.
                            </p>
                        </div>

                        <div className="agreement-checkbox-wrapper" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            marginTop: '20px', 
                            padding: '12px',
                            backgroundColor: agreed ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                            borderRadius: '8px',
                            border: `1px solid ${agreed ? '#10B981' : 'transparent'}`,
                            transition: 'all 0.2s ease',
                            cursor: 'pointer' 
                        }} onClick={() => setAgreed(!agreed)}>
                            <input 
                                type="checkbox" 
                                checked={agreed} 
                                onChange={(e) => setAgreed(e.target.checked)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10B981' }}
                            />
                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: agreed ? '#065f46' : '#334155' }}>
                                위 주의사항을 모두 확인하였으며, 이에 동의합니다.
                            </span>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ 
                                width: '100%', 
                                marginTop: '24px', 
                                padding: '18px', 
                                fontSize: '1.2rem', 
                                fontWeight: 700,
                                opacity: agreed ? 1 : 0.6,
                                transform: agreed ? 'scale(1)' : 'scale(0.98)',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={handleCompletePayment}
                        >
                            {finalPrice.toLocaleString()}원 결제하기 (V24)
                        </button>
                    </div>
                </div>
            </div>
            {/* 배송 기간 안내 모달 (Portal 사용으로 위치 문제 해결) */}
            {showDeliveryModal && createPortal(
                <div style={{
                    position: 'fixed', 
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)', 
                    zIndex: 99999,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '20px',
                    backdropFilter: 'blur(8px)',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setShowDeliveryModal(false)}>
                    <div style={{
                        backgroundColor: 'var(--surface)', 
                        padding: '40px', 
                        borderRadius: '24px',
                        maxWidth: '500px', 
                        width: '100%', 
                        border: '1px solid var(--primary)',
                        textAlign: 'center', 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        position: 'relative', 
                        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ 
                            fontSize: '4rem', 
                            marginBottom: '24px',
                            display: 'inline-block',
                            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))'
                        }}>🚚</div>
                        
                        <h3 style={{ 
                            fontSize: '1.6rem', 
                            fontWeight: 900, 
                            marginBottom: '24px', 
                            color: 'var(--primary)',
                            letterSpacing: '-0.02em'
                        }}>
                            [배송 기간 안내]
                        </h3>
                        
                        <div style={{ 
                            textAlign: 'left', 
                            lineHeight: '1.8', 
                            color: 'var(--text-main)', 
                            marginBottom: '32px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <p style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1.05rem', wordBreak: 'keep-all' }}>
                                본 상품은 결제 완료 후 제작/출고되는 상품으로, 배송 완료까지 영업일 기준 평균 3~4일이 소요됩니다. 
                                <span style={{ color: 'var(--primary)', marginLeft: '4px' }}>(주말 및 공휴일 제외)</span>
                            </p>
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                                ※ 택배사 사정이나 지역별 물류 상황에 따라 1~2일 정도 차이가 발생할 수 있는 점 양해 부탁드립니다.
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button 
                                className="btn btn-outline" 
                                style={{ flex: 1, padding: '18px', borderRadius: '12px' }}
                                onClick={() => setShowDeliveryModal(false)}
                            >
                                돌아가기
                            </button>
                            <button 
                                className="btn btn-primary" 
                                style={{ flex: 2, padding: '14px', fontWeight: 700 }}
                                onClick={handleConfirmOrder}
                            >
                                확인 및 결제하기
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Checkout;
