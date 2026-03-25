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
            <div className="product-image" style={{ backgroundColor: product.color }}>
                <span className="product-image-text">이미지 준비중</span>
            </div>
            <div className="product-info">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-price">{product.price.toLocaleString()}원</p>
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
