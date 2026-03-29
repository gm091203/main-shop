import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

export const dummyProducts = [
    { id: 1, name: 'FAKE 가라판', price: 260000, color: '#374151', description: '현역 가라판입니다.' },
    { id: 2, name: '전자 담배', price: 80000, color: '#1F2937', description: '실제 매장에서 구매후 보내드립니다.' },
    { id: 3, name: 'FAKE 실제 신분증', price: 200000, color: '#4B5563', description: '실제 신분증과 100% 유사합니다.' },
    { id: 4, name: '담배', price: 45000, color: '#111827', description: '내용물 파손없이 안전하게 보내드립니다.' },
    { id: 5, name: '전자 담배 액상', price: 35000, color: '#6B7280', description: '실제 매장에서 구매해서 보내드립니다.' },
    { id: 6, name: 'FAKE 핸드폰 신분증', price: 100000, color: '#4B5563', description: '구매시 하루 이후 사용가능합니다.' },
    { id: 7, name: 'FAKE 실제 운전 면허증', price: 200000, color: '#374151', description: '실제 운전면허증과 100% 유사합니다.' },
    { id: 8, name: '주류', price: 15000, color: '#1F2937', description: '내용물 파손없이 안전하게 보내드립니다.' },
    { id: 9, name: 'FAKE 핸드폰 운전 면허증', price: 100000, color: '#374151', description: '구매시 하루 이후 사용가능합니다.' },
];

const Home = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const heroScrollRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => {
            if (heroScrollRef.current) {
                const nextSlide = (currentSlide + 1) % 2;
                setCurrentSlide(nextSlide);
                heroScrollRef.current.scrollTo({
                    left: heroScrollRef.current.offsetWidth * nextSlide,
                    behavior: 'smooth'
                });
            }
        }, 6000);
        return () => clearInterval(timer);
    }, [currentSlide]);

    const handleManualScroll = (e) => {
        const index = Math.round(e.target.scrollLeft / e.target.offsetWidth);
        if (index !== currentSlide) setCurrentSlide(index);
    };

    const handleShopNow = () => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            alert('로그인이 필요한 서비스입니다.');
            navigate('/login');
        } else {
            window.scrollTo({ 
                top: (document.querySelector('.products-grid')?.offsetTop || 0) - 80, 
                behavior: 'smooth' 
            });
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Hero Slider Container */}
            <div 
                style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
            >
                <div 
                    ref={heroScrollRef}
                    onScroll={handleManualScroll}
                    style={{ 
                        position: 'relative', 
                        overflowX: 'auto', 
                        whiteSpace: 'nowrap', 
                        display: 'flex',
                        scrollSnapType: 'x mandatory',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch',
                    }}
                    className="hero-slider-container"
                >
                    <style>{`.hero-slider-container::-webkit-scrollbar { display: none; }`}</style>
                    

                    {/* Slide 2: Default Hero */}
                    <section className="hero-section" style={{ minWidth: '100%', flex: '0 0 100%', boxSizing: 'border-box', margin: 0, scrollSnapAlign: 'start' }}>
                        <h1 className="hero-title">안전하고 빠른구매</h1>
                        <p className="hero-subtitle">가장 안전하고 빠른 방법으로 구매하세요</p>
                        <button className="btn btn-outline hero-btn" style={{ fontWeight: 800, marginTop: '24px', width: 'auto' }} onClick={handleShopNow}>SHOP NOW</button>
                    </section>

                    {/* Slide 3: Sale Promo */}
                    <section style={{
                        minWidth: '100%', flex: '0 0 100%', boxSizing: 'border-box', margin: 0,
                        background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                        color: 'white',
                        padding: '100px 20px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        scrollSnapAlign: 'start'
                    }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>⚡ 타임 세일 특가 ⚡</h2>
                        <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '32px' }}>전자 담배, 주류 등 인기 품목 <strong style={{ color: '#fff' }}>특가 할인 중!</strong></p>
                        <button 
                            className="btn btn-outline" 
                            style={{ fontWeight: 800, borderColor: 'white', color: 'white', fontSize: '1.1rem', padding: '12px 32px', width: 'auto' }} 
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#047857'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'white'; }}
                            onClick={() => {
                                document.getElementById('sale-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            세일 상품 보러가기
                        </button>
                    </section>
                </div>

                {/* Dot Indicators */}
                <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                    {[0, 1].map(index => (
                        <div 
                            key={index}
                            onClick={() => {
                                setCurrentSlide(index);
                                if (heroScrollRef.current) {
                                    heroScrollRef.current.scrollTo({
                                        left: heroScrollRef.current.offsetWidth * index,
                                        behavior: 'smooth'
                                    });
                                }
                            }}
                            style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                background: currentSlide === index ? 'white' : 'rgba(255,255,255,0.4)',
                                cursor: 'pointer', transition: 'background 0.3s'
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Product Sections */}
            <section className="container" style={{ padding: '60px 15px 20px', minHeight: 'unset' }}>
                <h2 className="section-title"><span style={{ color: '#ef4444' }}>Hot</span> Arrivals 🔥</h2>
                <div className="products-grid">
                    {dummyProducts.filter(p => ['FAKE 가라판', '전자 담배', 'FAKE 실제 신분증', 'FAKE 핸드폰 신분증'].includes(p.name)).map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>

            <section id="sale-section" className="container" style={{ padding: '20px 15px 20px', minHeight: 'unset' }}>
                <h2 className="section-title" style={{ color: '#10b981' }}>Sale Arrivals ⚡</h2>
                <div className="products-grid">
                    {dummyProducts.filter(p => ['담배', '주류', '전자 담배 액상'].includes(p.name)).map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>

            <section className="container" style={{ padding: '20px 15px 60px', minHeight: 'unset' }}>
                <h2 className="section-title">All Products</h2>
                <div className="products-grid-wrap">
                    {dummyProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
