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
                <button onClick={handleDetailClick} className="btn btn-outline" style={{ width: '100%', marginTop: '12px' }}>
                    자세히 보기
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
