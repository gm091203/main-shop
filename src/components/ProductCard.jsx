import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();

    const handleDetailClick = (e) => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            e.preventDefault();
            alert('로그인이 필요한 서비스입니다.');
            navigate('/login');
        } else {
            navigate(`/product/${product.id}`);
        }
    };

    return (
        <div className="product-card animate-fade-in shadow-sm">
            <div className="product-image" style={{ backgroundColor: product.color, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {product.image ? (
                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <span className="product-image-text">이미지 준비중</span>
                )}
            </div>
            <div className="product-info">
                <h3 className="product-title">{product.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                    <p className="product-price" style={{ margin: 0 }}>{product.price.toLocaleString()}원</p>
                    {product.originalPrice && (
                        <>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', margin: 0 }}>
                                {product.originalPrice.toLocaleString()}원
                            </p>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                -10%
                            </span>
                        </>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={handleDetailClick} className="btn btn-outline" style={{ flex: 1, fontSize: '0.85rem', padding: '10px 4px' }}>
                        자세히 보기
                    </button>
                    <button 
                        onClick={(e) => {
                            const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
                            if (!isLoggedIn) {
                                alert('로그인이 필요한 서비스입니다.');
                                navigate('/login');
                            } else {
                                navigate(`/product/${product.id}`, { state: { openSettings: true } });
                            }
                        }} 
                        className="btn btn-primary" 
                        style={{ flex: 1, fontSize: '0.85rem', padding: '10px 4px' }}
                    >
                        상세 설정
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
