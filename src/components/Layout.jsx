import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Header from './Header';
import ChatWidget from './ChatWidget';

const Layout = ({ cartItems = [], isCartOpen = false, setIsCartOpen, removeFromCart }) => {
    // 상품 총 수량
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const navigate = useNavigate();

    const handleCheckout = () => {
        if (cartItems.length === 0) return;
        setIsCartOpen(false);
        navigate('/checkout', { state: { items: cartItems } });
    };

    return (
        <div className="app-container">
            <Header setIsChatOpen={setIsChatOpen} />
            <main className="main-content">
                <Outlet />
            </main>
            <footer style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <p>&copy; 2026 ZEO'S SHOP All rights reserved.</p>
                <p>프리미엄 시크릿 셀렉트샵</p>
            </footer>
            {/* 이전 코드들... */}
            {/* ... */}
            {/* 장바구니 슬라이드 사이드 패널 내의 버튼 부분으로 바로 이동 */}


            {/* 플로팅 장바구니 버튼 */}
            <div
                className="cart-floating-btn shadow-lg"
                onClick={() => setIsCartOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), #D97706)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 9998,
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {totalItems > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0px',
                        right: '0px',
                        background: 'white',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--surface)'
                    }}>
                        {totalItems}
                    </span>
                )}
            </div>

            {/* 장바구니 슬라이드 사이드 패널 */}
            <div style={{
                position: 'fixed', top: 0, right: isCartOpen ? 0 : '-100%',
                width: '100vw', maxWidth: '400px', height: '100vh',
                background: 'var(--surface)', borderLeft: '1px solid var(--border)',
                zIndex: 10000, transition: 'right 0.3s ease-in-out',
                display: 'flex', flexDirection: 'column',
                boxShadow: isCartOpen ? '-5px 0 25px rgba(0,0,0,0.5)' : 'none'
            }}>
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>장바구니 ({totalItems})</h2>
                    <button onClick={() => setIsCartOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {cartItems.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                            <svg style={{ margin: '0 auto 16px', opacity: 0.5 }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                            <p>장바구니가 비어있습니다.</p>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: item.color, flexShrink: 0 }}></div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '0.95rem', margin: '0 0 4px', color: 'var(--text-main)' }}>{item.name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1rem' }}>{(item.price * item.quantity).toLocaleString()}원</div>
                                        {item.quantity > 1 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(개당 {item.price.toLocaleString()}원)</div>}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>수량: {item.quantity}개</div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', alignSelf: 'flex-start' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            <span>총 결제금액</span>
                            <span style={{ color: 'var(--primary)' }}>
                                {cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}원
                            </span>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '16px' }}
                            onClick={handleCheckout}
                        >
                            주문하기
                        </button>
                    </div>
                )}
            </div>

            {/* 오프캔버스 배경 딤 (어둡게) */}
            {isCartOpen && (
                <div onClick={() => setIsCartOpen(false)} style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.6)', zIndex: 9999,
                    animation: 'fadeIn 0.3s ease-in-out'
                }} />
            )}

            {/* 실시간 채팅 위젯 */}
            <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    );
};

export default Layout;
