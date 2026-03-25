import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dummyProducts } from './Home';

const ProductDetail = ({ addToCart }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const product = dummyProducts.find(p => p.id === parseInt(id));

    const [quantity, setQuantity] = useState(1);
    const [showAddressInput, setShowAddressInput] = useState(false);
    const [showDetailInput, setShowDetailInput] = useState(false);
    const [customAddress, setCustomAddress] = useState('');
    const [specificAddress, setSpecificAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [idName, setIdName] = useState('');
    const [idBirth, setIdBirth] = useState('');
    const [idAddress, setIdAddress] = useState(''); // Address on ID
    const [idPhoto, setIdPhoto] = useState(null);

    useEffect(() => {
        if (location.state?.openSettings) {
            setShowDetailInput(true);
        }
    }, [location.state]);

    if (!product) {
        return (
            <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
                <h2>상품을 찾을 수 없습니다.</h2>
            </div>
        );
    }

    const isIdProduct = product.name.includes('신분증') || product.name.includes('면허증');

    const handleBuyNow = () => {
        navigate('/checkout', { state: { product: { ...product, quantity, customAddress, specificAddress, detailAddress, idName, idBirth, idAddress, idPhoto: idPhoto ? '파일 업로드됨' : '' } } });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIdPhoto(file.name); // Storing name as simulation
        }
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
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginBottom: '24px' }}>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, wordBreak: 'keep-all' }}>
                            이 상품은 최고급 소재로 제작되어 내구성이 뛰어납니다. 모던한 디자인으로 어느 공간에나 잘 어울리며, 당신의 라이프스타일을 한층 업그레이드해 줄 완벽한 아이템입니다.
                        </p>
                    </div>

                    {/* Input Sections (Split) */}
                    <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Detailed Settings Button & Input */}
                        <div>
                            <button 
                                onClick={() => setShowDetailInput(!showDetailInput)}
                                style={{ 
                                    background: 'rgba(234, 88, 12, 0.1)', 
                                    border: '1px solid var(--primary)', 
                                    color: 'var(--primary)',
                                    padding: '8px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    marginBottom: showDetailInput ? '12px' : '0',
                                    width: '100%'
                                }}
                            >
                                {showDetailInput ? '상세 설정 닫기' : '상세 설정'}
                            </button>
                            
                            {showDetailInput && (
                                <div className="animate-fade-in" style={{ marginTop: '12px' }}>
                                    {isIdProduct ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: 'rgba(234, 88, 12, 0.05)', borderRadius: '12px', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
                                            <h4 style={{ color: 'var(--primary)', marginBottom: '4px', fontSize: '0.95rem' }}>신분증 정보 입력</h4>
                                            
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>성함:</label>
                                                <input 
                                                    type="text" 
                                                    className="input-field" 
                                                    placeholder="실명을 입력해 주세요" 
                                                    value={idName}
                                                    onChange={(e) => setIdName(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.9rem' }}
                                                />
                                            </div>
                                            
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>주민등록번호 (13자리):</label>
                                                <input 
                                                    type="text" 
                                                    className="input-field" 
                                                    placeholder="예: 950101-1234567" 
                                                    value={idBirth}
                                                    onChange={(e) => setIdBirth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.9rem' }}
                                                />
                                            </div>
                                            
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>신분증상 주소:</label>
                                                <input 
                                                    type="text" 
                                                    className="input-field" 
                                                    placeholder="신분증에 기재된 전체 주소" 
                                                    value={idAddress}
                                                    onChange={(e) => setIdAddress(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.9rem' }}
                                                />
                                            </div>
                                            
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>신분증 사진 업로드:</label>
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handlePhotoChange}
                                                    style={{ width: '100%', color: '#cbd5e1', fontSize: '0.85rem' }}
                                                />
                                                {idPhoto && <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>✓ {idPhoto} 선택됨</div>}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                {product.name.includes('가라판') ? '활동 지역을 적어주세요:' : '상세 정보 및 요청 사항:'}
                                            </label>
                                            <textarea 
                                                className="input-field" 
                                                placeholder={product.name.includes('가라판') ? '예: 서울 강남 지역, 부산 서면 등...' : '예: 주문 제작 문구, 특이 사항 등을 입력해 주세요.'} 
                                                value={detailAddress}
                                                onChange={(e) => setDetailAddress(e.target.value)}
                                                style={{ width: '100%', padding: '12px', minHeight: '100px', resize: 'vertical', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Delivery Address Button & Input */}
                        <div>
                            <button 
                                onClick={() => setShowAddressInput(!showAddressInput)}
                                style={{ 
                                    background: 'rgba(16, 185, 129, 0.1)', 
                                    border: '1px solid #10b981', 
                                    color: '#10b981',
                                    padding: '8px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    marginBottom: showAddressInput ? '12px' : '0',
                                    width: '100%'
                                }}
                            >
                                {showAddressInput ? '배송지 주소창 닫기' : '배송지 주소 입력'}
                            </button>
                            
                            {showAddressInput && (
                                <div className="animate-fade-in" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>배송지 주소 (기본 주소):</label>
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            placeholder="예: 서울특별시 강남구..." 
                                            value={customAddress}
                                            onChange={(e) => setCustomAddress(e.target.value)}
                                            style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>상세 주소 (건물명, 동/호수 등):</label>
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            placeholder="예: 제오스 빌딩 7층 701호" 
                                            value={specificAddress}
                                            onChange={(e) => setSpecificAddress(e.target.value)}
                                            style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
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
                            onClick={() => addToCart({ ...product, quantity, customAddress, specificAddress, detailAddress, idName, idBirth, idAddress, idPhoto: idPhoto ? '파일 업로드됨' : '' })}
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
