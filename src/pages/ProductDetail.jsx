import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { dummyProducts } from './Home';

const ProductDetail = ({ addToCart }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const product = dummyProducts.find(p => p.id === parseInt(id));

    const [quantity, setQuantity] = useState(1);

    if (!product) {
        return (
            <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
                <h2>상품을 찾을 수 없습니다.</h2>
            </div>
        );
    }

    const handleBuyNow = () => {
        navigate('/checkout', { state: { product: { ...product, quantity } } });
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '40px 20px' }}>
            <div className="detail-container">

                {/* Product Image */}
                <div className="product-image" style={{ backgroundColor: product.color, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        매력적인 상품 이미지
                    </span>
                </div>

                {/* Product Info */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)', wordBreak: 'keep-all' }}>
                        {product.name}
                    </h1>
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {(product.price * quantity).toLocaleString()}원
                        </span>
                        {quantity > 1 && (
                            <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                                (개당 {product.price.toLocaleString()}원)
                            </span>
                        )}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginBottom: '32px' }}>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, wordBreak: 'keep-all' }}>
                            이 상품은 최고급 소재로 제작되어 내구성이 뛰어납니다. 모던한 디자인으로 어느 공간에나 잘 어울리며, 당신의 라이프스타일을 한층 업그레이드해 줄 완벽한 아이템입니다.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                        <span style={{ fontWeight: 600 }}>수량:</span>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            <button 
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                style={{ padding: '8px 12px', background: 'var(--surface)', border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-main)', fontSize: '1.2rem' }}
                            >-</button>
                            <span style={{ padding: '8px 16px', fontWeight: 600, minWidth: '50px', textAlign: 'center' }}>{quantity}</span>
                            <button 
                                onClick={() => setQuantity(quantity + 1)}
                                style={{ padding: '8px 12px', background: 'var(--surface)', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-main)', fontSize: '1.2rem' }}
                            >+</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-outline"
                            style={{ flex: '1 1 auto', padding: '16px' }}
                            onClick={() => addToCart({ ...product, quantity })}
                        >
                            장바구니 담기
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ flex: '1 1 auto', padding: '16px' }}
                            onClick={handleBuyNow}
                        >
                            바로 구매하기
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductDetail;
