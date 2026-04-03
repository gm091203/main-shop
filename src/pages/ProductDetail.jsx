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
    const [vapeBrand, setVapeBrand] = useState('');
    const [vapeModel, setVapeModel] = useState('');
    const [vapePrice, setVapePrice] = useState(0);

    useEffect(() => {
        if (location.state?.openSettings || (product && (product.name.includes('전자 담배') || product.name.includes('액상') || product.name.includes('주류') || product.name === '담배'))) {
            setShowDetailInput(true);
        }
    }, [location.state, product]);

    if (!product) {
        return (
            <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
                <h2>상품을 찾을 수 없습니다.</h2>
            </div>
        );
    }

    const isIdProduct = product.name.includes('신분증') || product.name.includes('면허증');
    const isVapeDevice = product.name.includes('전자 담배') && !product.name.includes('액상');
    const isVapeLiquid = product.name.includes('액상');
    const isLiquor = product.name.includes('주류');
    const isCigarette = product.name === '담배';
    const isVapeProduct = isVapeDevice || isVapeLiquid;
    const isDetailedProduct = isVapeProduct || isLiquor || isCigarette;

    const handleBuyNow = () => {
        if (!customAddress) {
            alert('입력해 주세요');
            return;
        }
        if (isDetailedProduct && !vapeModel) {
            alert('입력해 주세요');
            return;
        }
        const finalPrice = vapePrice || product.price;
        navigate('/checkout', { 
            state: { 
                product: { 
                    ...product, 
                    price: finalPrice, 
                    quantity, 
                    customAddress, 
                    idName, 
                    idBirth, 
                    idAddress, 
                    idPhoto, 
                    vapeBrand, 
                    vapeModel,
                    vapeModelName: isCigarette ? `${vapeModel} (보루)` : vapeModel
                } 
            } 
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIdPhoto(file.name); // Storing name as simulation
        }
    };

    const vapeDeviceModelsByBrand = {
        '유웰 (UWELL)': [
            { name: '발라리안 맥스 프로', price: 70200 },
            { name: '발라리안 맥스', price: 58500 },
            { name: '발라리안 R', price: 47700 },
            { name: '하복(Havok) 킷', price: 67500 },
            { name: '칼리번 G3', price: 45000 }
        ],
        '부푸 (VOOPOO)': [
            { name: '드래그 X 프로', price: 81000 },
            { name: '드래그 S 프로', price: 76500 },
            { name: '빈치 3', price: 54000 },
            { name: '아르고스 P2', price: 58500 },
            { name: '드래그 H80S', price: 90000 }
        ],
        '릴렉스 (RELX)': [
            { name: 'RELX Infinity 2', price: 54000 },
            { name: 'RELX Essential', price: 36000 },
            { name: 'RELX Artisan', price: 90000 },
            { name: 'RELX Phantom', price: 63000 },
            { name: 'RELX Infinity Plus', price: 72000 }
        ],
        '스모크 (SMOK)': [
            { name: '노보 5', price: 36000 },
            { name: 'RPM 5', price: 72000 },
            { name: 'Nord 5', price: 63000 },
            { name: 'IPX80', price: 76500 },
            { name: 'RPM 100', price: 85500 }
        ],
        '아스파이어 (Aspire)': [
            { name: 'Cyber X', price: 45000 },
            { name: 'Flexus Q', price: 54000 },
            { name: 'Gotek X', price: 36000 },
            { name: 'Nautilus Prime X', price: 81000 },
            { name: 'BP80', price: 76500 }
        ],
        '아이코스 (IQOS)': [
            { name: '아이코스 일루마 프라임', price: 116100 },
            { name: '아이코스 일루마', price: 89100 },
            { name: '아이코스 일루마 원', price: 62100 },
            { name: '아이코스 3 듀오', price: 81000 },
            { name: '아이코스 멀티', price: 63000 }
        ],
        '릴 (KT&G lil)': [
            { name: '릴 에이블', price: 90000 },
            { name: '릴 하이브리드 3.0', price: 99000 },
            { name: '릴 솔리드 2.0', price: 63000 },
            { name: '릴 미니', price: 45000 },
            { name: '릴 플러스', price: 72000 }
        ],
        '하카 (Haka)': [
            { name: '하카 H', price: 90000 },
            { name: '하카 Q', price: 72000 },
            { name: '하카 뉴 블레이드', price: 63000 },
            { name: '하카 시그니처', price: 81000 },
            { name: '하카 B', price: 76500 }
        ],
        '글로 (glo / BAT)': [
            { name: '글로 하이퍼 프로', price: 90000 },
            { name: '글로 하이퍼 X2', price: 72000 },
            { name: '글로 프로', price: 63000 },
            { name: '글로 나노', price: 45000 },
            { name: '글로 센스', price: 54000 }
        ],
        '아보카도 (Avocado)': [
            { name: '아보카도 베이비', price: 45000 },
            { name: '아보카도 베이비 프로', price: 62100 }
        ],
        '젤로 (Jello)': [
            { name: '젤로', price: 47700 },
            { name: '젤로 맥스', price: 58500 },
            { name: '젤로 크리스탈', price: 62100 },
            { name: '젤로 울트라', price: 64800 }
        ]
    };

    const vapeLiquidModelsByBrand = {
        'Nasty Juice': [
            { name: '네스티 ASAP 그레이프', price: 27000 },
            { name: '네스티 하이민트', price: 28800 },
            { name: '네스티 망고 아이스', price: 27000 },
            { name: '네스티 더블 애플', price: 27000 },
            { name: '네스티 콜라 아이스', price: 25200 }
        ],
        'Dinner Lady': [
            { name: '디너레이디 레몬타르트', price: 28800 },
            { name: '디너레이디 스트로베리 마카롱', price: 31500 },
            { name: '디너레이디 바나나 아이스', price: 27000 },
            { name: '디너레이디 망고 타르트', price: 28800 },
            { name: '디너레이디 바닐라 커스터드', price: 31500 }
        ],
        'VGOD': [
            { name: '브이고드 쿠바노', price: 31500 },
            { name: '브이고드 망고밤', price: 27000 },
            { name: '브이고드 라쉬 아이스', price: 28800 },
            { name: '브이고드 퍼플밤', price: 27000 },
            { name: '브이고드 베리밤', price: 27000 }
        ],
        'BLVK': [
            { name: 'BLVK 유니콘', price: 27000 },
            { name: 'BLVK 블루라즈 아이스', price: 28800 },
            { name: 'BLVK 스트로베리', price: 27000 },
            { name: 'BLVK 파인애플 아이스', price: 28800 },
            { name: 'BLVK 그린애플', price: 27000 }
        ],
        'Jam Monster': [
            { name: '잼몬스터 스트로베리 잼', price: 31500 },
            { name: '잼몬스터 블루베리 잼', price: 31500 },
            { name: '잼몬스터 애플 잼', price: 31500 },
            { name: '잼몬스터 그레이프 잼', price: 31500 },
            { name: '잼몬스터 피넛버터', price: 34200 }
        ]
    };

    const liquorModelsByBrand = {
        '소주 (Soju)': [
            { name: '참이슬 후레쉬', price: 1710 },
            { name: '참이슬 클래식', price: 1710 },
            { name: '처음처럼', price: 1710 },
            { name: '진로', price: 1620 },
            { name: '새로', price: 1890 }
        ],
        '맥주 (Beer)': [
            { name: '카스', price: 2520 },
            { name: '테라', price: 2520 },
            { name: '하이트', price: 2520 },
            { name: '켈리', price: 2520 }
        ]
    };

    const cigaretteModelsByBrand = {
        '말보로 (Marlboro)': [
            { name: '말보로 레드', price: 40500 },
            { name: '말보로 미디엄', price: 40500 },
            { name: '말보로 화이트', price: 40500 },
            { name: '말보로 아이스 블라스트', price: 40500 },
            { name: '말보로 비스타', price: 40500 },
            { name: '말보로 비스타 트로피컬', price: 40500 },
            { name: '말보로 비스타 썸머', price: 40500 },
            { name: '말보로 비스타 블러썸', price: 40500 },
            { name: '말보로 비스타 가든', price: 40500 }
        ],
        '에쎄 (Esse)': [
            { name: '에쎄 라이트', price: 40500 },
            { name: '에쎄 체인지', price: 40500 },
            { name: '에쎄 수', price: 40500 },
            { name: '에쎄 골든리프', price: 40500 }
        ],
        '던힐 (Dunhill)': [
            { name: '던힐 루비 부스트', price: 40500 },
            { name: '던힐 뉴욕', price: 40500 },
            { name: '던힐 파리', price: 40500 },
            { name: '던힐 런던', price: 40500 },
            { name: '던힐 썸머 크러쉬', price: 40500 }
        ],
        '보헴 (Bohem)': [
            { name: '보헴 넘버6', price: 40500 },
            { name: '보헴 넘버3', price: 40500 },
            { name: '보헴 시그니처', price: 90000 },
            { name: '보헴 리브레', price: 40500 },
            { name: '보헴 카리브', price: 40500 },
            { name: '보헴 마스터', price: 63000 },
            { name: '보헴 쿠바나 샷', price: 40500 },
            { name: '보헴 쿠바나 더블', price: 40500 },
            { name: '보헴 파이프 스코티', price: 40500 }
        ],
        '블랙데빌 (Black Devil)': [
            { name: '블랙데빌 블랙', price: 58500 },
            { name: '블랙데빌 그레이', price: 58500 }
        ],
        '메비우스 (Mevius)': [
            { name: '메비우스 오리지널', price: 40500 },
            { name: '메비우스 스카이 블루', price: 40500 },
            { name: '메비우스 윈드블루', price: 40500 },
            { name: '메비우스 선셋비치', price: 40500 },
            { name: '메비우스 믹스그린', price: 40500 },
            { name: '메비우스 스파클링 듀', price: 40500 },
            { name: '메비우스 아이스 바나', price: 40500 },
            { name: '메비우스 나이스티', price: 40500 },
            { name: '메비우스 시트로 웨이브', price: 40500 },
            { name: '메비우스 아이스 스톰', price: 40500 },
            { name: '메비우스 LSS 3mg', price: 40500 }
        ],
        '레종 (Raison)': [
            { name: '레종 블루', price: 40500 },
            { name: '레종 프렌치 블랙', price: 40500 },
            { name: '레종 프렌치 요고', price: 40500 },
            { name: '레종 아이스 블랑', price: 40500 },
            { name: '레종 프렌치 썸', price: 40500 },
            { name: '레종 이오니아 핑크', price: 40500 },
            { name: '레종 이오니아 그린', price: 40500 },
            { name: '레종 이오니아 퍼플', price: 40500 },
            { name: '레종 이오니아 레드', price: 40500 }
        ],
        '기타 브랜드': [
            { name: '카멜 블루', price: 40500 },
            { name: '카멜 필터', price: 40500 },
            { name: '디스 플러스', price: 40500 },
            { name: '더원 블루', price: 40500 },
            { name: '더원 오리지널', price: 40500 }
        ]
    };

    const activeModelsByBrand = isVapeLiquid 
        ? vapeLiquidModelsByBrand 
        : isLiquor 
            ? liquorModelsByBrand 
            : isCigarette
                ? cigaretteModelsByBrand
                : vapeDeviceModelsByBrand;

    return (
        <div className="container animate-fade-in" style={{ padding: '40px 20px' }}>
            <div className="detail-container">

                {/* Product Image */}
                <div className="product-image" style={{ backgroundColor: product.color, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {product.image ? (
                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                            이미지 준비중
                        </span>
                    )}
                </div>

                {/* Product Info */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)', wordBreak: 'keep-all' }}>
                        {product.name}
                    </h1>
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {product.originalPrice && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                                        {(product.originalPrice * quantity).toLocaleString()}원
                                    </span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                        -10% SALE
                                    </span>
                                </div>
                            )}
                            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                                {((vapePrice || product.price) * quantity).toLocaleString()}원
                            </span>
                        </div>
                        {quantity > 1 && (
                            <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                                (개당 {(vapePrice || product.price).toLocaleString()}원)
                            </span>
                        )}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginBottom: '24px' }}>
                        <p style={{ color: 'var(--text-main)', lineHeight: 1.6, wordBreak: 'keep-all', fontWeight: 500 }}>
                            {product.description || '최고급 소재로 제작된 프리미엄 상품입니다. 당신의 라이프스타일을 한층 업그레이드해 줄 완벽한 아이템입니다.'}
                        </p>
                    </div>

                    {/* Input Sections (Split) */}
                    <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* 요청 배송 주소 입력 (항상 노출 및 필수) */}
                        <div style={{ 
                            marginBottom: '16px', 
                            padding: '16px', 
                            backgroundColor: 'rgba(234, 88, 12, 0.05)', 
                            borderRadius: '12px',
                            border: '1px solid var(--primary)'
                        }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                                배송 주소 입력 (필수)
                            </label>
                            <input 
                                type="text" 
                                className="input-field" 
                                placeholder="정확한 배송 주소를 입력해 주세요." 
                                value={customAddress}
                                onChange={(e) => setCustomAddress(e.target.value)}
                                style={{ width: '100%', padding: '12px' }}
                            />
                        </div>


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
                                    ) : isDetailedProduct ? (
                                        <div style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            gap: '16px', 
                                            padding: '16px', 
                                            backgroundColor: isLiquor ? 'rgba(59, 130, 246, 0.05)' : isCigarette ? 'rgba(234, 88, 12, 0.05)' : 'rgba(16, 185, 129, 0.05)', 
                                            borderRadius: '12px', 
                                            border: isLiquor ? '1px solid rgba(59, 130, 246, 0.2)' : isCigarette ? '1px solid rgba(234, 88, 12, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)' 
                                        }}>
                                            <div>
                                                <h4 style={{ color: isLiquor ? '#3b82f6' : isCigarette ? '#ea580c' : '#10b981', marginBottom: '8px', fontSize: '0.95rem' }}>1. {isLiquor ? '주류 종류 선택' : '브랜드 선택'}</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                                    {Object.keys(activeModelsByBrand).map(brand => (
                                                        <button
                                                            key={brand}
                                                            onClick={() => {
                                                                setVapeBrand(brand);
                                                                setVapeModel('');
                                                                setVapePrice(0);
                                                            }}
                                                            style={{
                                                                padding: '10px 8px',
                                                                borderRadius: '8px',
                                                                fontSize: '0.8rem',
                                                                border: '1px solid',
                                                                borderColor: vapeBrand === brand ? (isLiquor ? '#3b82f6' : isCigarette ? '#ea580c' : '#10b981') : 'rgba(255,255,255,0.1)',
                                                                backgroundColor: vapeBrand === brand ? (isLiquor ? 'rgba(59, 130, 246, 0.2)' : isCigarette ? 'rgba(234, 88, 12, 0.2)' : 'rgba(16, 185, 129, 0.2)') : 'rgba(255,255,255,0.05)',
                                                                color: vapeBrand === brand ? (isLiquor ? '#3b82f6' : isCigarette ? '#ea580c' : '#10b981') : 'var(--text-main)',
                                                                transition: 'all 0.2s',
                                                                textAlign: 'center'
                                                            }}
                                                        >
                                                            {brand}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {vapeBrand && activeModelsByBrand[vapeBrand] && (
                                                <div className="animate-fade-in" style={{ borderTop: isLiquor ? '1px solid rgba(59, 130, 246, 0.2)' : isCigarette ? '1px solid rgba(234, 88, 12, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)', paddingTop: '16px' }}>
                                                    <h4 style={{ color: isLiquor ? '#3b82f6' : isCigarette ? '#ea580c' : '#10b981', marginBottom: '8px', fontSize: '0.95rem' }}>2. 상세 {isLiquor ? '품목' : isCigarette ? '종류' : '모델'} 선택 ({vapeBrand})</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {activeModelsByBrand[vapeBrand].map(model => (
                                                            <button
                                                                key={model.name}
                                                                onClick={() => {
                                                                    setVapeModel(model.name);
                                                                    setVapePrice(model.price);
                                                                }}
                                                                style={{
                                                                    padding: '12px 16px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.9rem',
                                                                    border: '1px solid',
                                                                    borderColor: vapeModel === model.name ? (isLiquor ? '#3b82f6' : isCigarette ? '#ea580c' : '#10b981') : 'rgba(255,255,255,0.1)',
                                                                    backgroundColor: vapeModel === model.name ? (isLiquor ? 'rgba(59, 130, 246, 0.2)' : isCigarette ? 'rgba(234, 88, 12, 0.2)' : 'rgba(16, 185, 129, 0.2)') : 'rgba(255,255,255,0.05)',
                                                                    color: vapeModel === model.name ? (isLiquor ? '#3b82f6' : isCigarette ? '#ea580c' : '#10b981') : 'var(--text-main)',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
                                                                <span>{model.name}</span>
                                                                <span style={{ fontWeight: 700 }}>{model.price.toLocaleString()}원</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {vapeBrand && (
                                                <p style={{ fontSize: '0.85rem', color: isLiquor ? '#3b82f6' : isCigarette ? '#ea580c' : '#10b981', marginTop: '4px' }}>
                                                    선택됨: <strong>{vapeBrand} {vapeModel ? `/ ${vapeModel}` : ''} {isCigarette ? `(보루)` : ''}</strong>
                                                </p>
                                            )}
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
                            onClick={() => {
                                if (!customAddress) {
                                    alert('입력해 주세요');
                                    return;
                                }
                                if (isDetailedProduct && !vapeModel) {
                                    alert('입력해 주세요');
                                    return;
                                }
                                addToCart({ 
                                    ...product, 
                                    price: vapePrice || product.price, 
                                    quantity, 
                                    customAddress, 
                                    idName, 
                                    idBirth, 
                                    idAddress, 
                                    idPhoto, 
                                    vapeBrand, 
                                    vapeModel,
                                    vapeModelName: isCigarette ? `${vapeModel} (보루)` : vapeModel
                                });
                            }}
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
