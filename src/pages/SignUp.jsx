import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

const SignUp = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        ssnFront: '',
        ssnBack: '',
        phone: '',
        address: '',
        detailAddress: '',
        id: '',
        password: '',
        passwordConfirm: ''
    });
    const [agreed, setAgreed] = useState(false);
    const [isIdChecked, setIsIdChecked] = useState(false);
    const [idMessage, setIdMessage] = useState({ text: '', type: '' });
    const [isCheckingId, setIsCheckingId] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // 아이디가 변경되면 중복 확인 상태 초기화
        if (name === 'id') {
            setIsIdChecked(false);
            setIdMessage({ text: '', type: '' });
        }
    };

    const checkIdDuplication = async () => {
        if (!formData.id || formData.id.length < 4) {
            alert('아이디를 4자 이상 입력해주세요.');
            return;
        }

        setIsCheckingId(true);
        try {
            const trimmedId = formData.id.trim();
            let isTaken = false;

            // 전체 조회 프로세스 (직접 조회 + 폴백 쿼리)를 하나의 타임아웃으로 감싸기
            await Promise.race([
                (async () => {
                    // 1단계: 문서 ID 직접 조회 (최적화)
                    const userDocRef = doc(db, 'users', trimmedId);
                    const userSnap = await getDoc(userDocRef);
                    isTaken = userSnap.exists();

                    // 2단계: 기존 랜덤 ID 방식 호환 (폴백)
                    if (!isTaken) {
                        const q = query(collection(db, 'users'), where('id', '==', trimmedId));
                        const querySnapshot = await getDocs(q);
                        isTaken = !querySnapshot.empty;
                    }
                })(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 10000))
            ]);

            if (isTaken) {
                setIsIdChecked(false);
                setIdMessage({ text: '이미 사용 중인 아이디입니다.', type: 'error' });
            } else {
                setIsIdChecked(true);
                setIdMessage({ text: '사용 가능한 아이디입니다.', type: 'success' });
            }
        } catch (error) {
            console.error("ID Check Error (V11):", error);
            if (error.message === "TIMEOUT") {
                alert('중복 확인 중 응답 시간이 초과되었습니다. (V11)');
            } else {
                alert(`아이디 중복 확인 오류 [V11]: [${error.code || 'UNKNOWN'}] ${error.message}`);
            }
        } finally {
            setIsCheckingId(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        // 간단한 검증 로직
        if (!formData.name || !formData.id || !formData.password) {
            alert('이름, 아이디, 비밀번호는 필수 입력 항목입니다.');
            return;
        }

        if (!isIdChecked) {
            alert('아이디 중복 확인을 진행해주세요.');
            return;
        }

        if (idMessage.type === 'error') {
            alert('이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.');
            return;
        }
        if (formData.password !== formData.passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!agreed) {
            alert('이용자 주의사항 및 경고문에 동의하셔야 가입이 가능합니다.');
            return;
        }

        setIsRegistering(true);
        setStatusMessage('가입 처리 중...');

        try {
            console.log("Starting signup process for ID:", formData.id);
            
            // 중복 아이디 최종 체크
            await Promise.race([
                (async () => {
                    const userDocRef = doc(db, 'users', formData.id);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        throw new Error("ALREADY_EXISTS");
                    }
                })(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 10000))
            ]);
            
            // Firestore에 유저 정보 저장
            const newUser = {
                ...formData,
                createdAt: new Date().toISOString(),
                isAdmin: false
            };
            
            delete newUser.passwordConfirm;

            const userDocRef = doc(db, 'users', formData.id);
            console.log("Saving user data to Firestore...");
            await Promise.race([
                setDoc(userDocRef, newUser),
                new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 10000))
            ]);

            console.log("Signup successful!");
            setStatusMessage('회원가입이 완료되었습니다! 잠시 후 로그인 페이지로 이동합니다.');

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error("Critical Signup Error:", error);
            if (error.message === "TIMEOUT") {
                alert('처리 시간 초과 (V8)');
            } else if (error.message === "ALREADY_EXISTS") {
                alert('이미 존재하는 아이디입니다. 다른 아이디를 사용해주세요.');
                setIsIdChecked(false);
                setIdMessage({ text: '이미 사용 중인 아이디입니다.', type: 'error' });
            } else {
                alert(`가입 처리 오류 [V8]: [${error.code || 'UNKNOWN'}] ${error.message}`);
            }
            setIsRegistering(false);
            setStatusMessage('');
        }
    };

    return (
        <div className="container animate-fade-in auth-container">
            <div className="auth-card" style={{ maxWidth: '480px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px', textAlign: 'center' }}>회원가입</h2>

                <form onSubmit={handleSignup}>
                    <div className="input-group">
                        <label className="input-label">이름</label>
                        <input type="text" name="name" className="input-field" placeholder="홍길동" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">주민등록번호</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                            <input type="text" name="ssnFront" className="input-field" placeholder="앞자리 (6자리)" maxLength={6} style={{ flex: '1 1 0', minWidth: 0 }} value={formData.ssnFront} onChange={handleChange} />
                            <span style={{ flexShrink: 0 }}>-</span>
                            <input type="password" name="ssnBack" className="input-field" placeholder="뒷자리 (7자리)" maxLength={7} style={{ flex: '1 1 0', minWidth: 0 }} value={formData.ssnBack} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">전화번호 (휴대폰)</label>
                        <input type="tel" name="phone" className="input-field" placeholder="010-0000-0000" value={formData.phone} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">집 주소</label>
                        <input type="text" name="address" className="input-field" placeholder="기본 주소 (예: 서울특별시 강남구 테헤란로 123)" value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">상세 주소</label>
                        <input type="text" name="detailAddress" className="input-field" placeholder="상세 주소 (동, 호수 등)" value={formData.detailAddress} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">아이디</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                name="id"
                                className="input-field"
                                placeholder="아이디를 입력하세요 (4자 이상)"
                                value={formData.id}
                                onChange={handleChange}
                                required
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={checkIdDuplication}
                                disabled={isCheckingId}
                                style={{
                                    padding: '0 15px',
                                    backgroundColor: isCheckingId ? '#64748b' : '#334155',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: isCheckingId ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isCheckingId ? '확인 중... (V6)' : '중복 확인'}
                            </button>
                        </div>
                        {idMessage.text && (
                            <p style={{
                                fontSize: '0.8rem',
                                marginTop: '4px',
                                color: idMessage.type === 'error' ? '#ef4444' : '#10b981',
                                fontWeight: 500
                            }}>
                                {idMessage.text}
                            </p>
                        )}
                    </div>
                    <div className="input-group">
                        <label className="input-label">비밀번호</label>
                        <input type="password" name="password" className="input-field" placeholder="비밀번호를 입력하세요 (8자 이상)" value={formData.password} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">비밀번호 확인</label>
                        <input type="password" name="passwordConfirm" className="input-field" placeholder="비밀번호를 다시 입력하세요" value={formData.passwordConfirm} onChange={handleChange} required />
                    </div>

                    {/* 이용자 주의사항 및 경고문 */}
                    <div style={{
                        marginTop: '24px',
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        color: '#475569',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        lineHeight: '1.6'
                    }}>
                        <h4 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '12px', fontSize: '0.95rem' }}>
                            [회원가입 시 이용자 주의사항 및 경고문]
                        </h4>
                        <p style={{ marginBottom: '12px' }}>
                            본 서비스의 회원이 되시는 고객님께서는 원활하고 안전한 서비스 이용을 위해 아래의 주의사항을 반드시 확인해 주시기 바랍니다.
                        </p>
                        
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#334155', display: 'block', marginBottom: '4px' }}>1. 계정 정보 관리 및 보안 유지</strong>
                            • <strong>비밀번호 관리:</strong> 타인이 추측하기 쉬운 비밀번호 사용을 지양하고, 정기적으로 변경하시기 바랍니다. 본인 부주의로 인한 계정 정보 유출의 책임은 사용자에게 있습니다.<br/>
                            • <strong>1인 1계정 원칙:</strong> 본 서비스는 실명 인증을 통한 1인 1계정 이용을 원칙으로 합니다. 타인의 정보를 도용하여 가입할 경우 법적 처벌을 받을 수 있으며 서비스 이용이 영구 정지됩니다.
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#334155', display: 'block', marginBottom: '4px' }}>2. 부정 이용 및 금지 행위</strong>
                            • <strong>비정상적 접근:</strong> 매크로, 해킹, 시스템 취약점 악용 등 비정상적인 방법으로 서비스를 이용하거나 서버에 부하를 주는 행위를 엄격히 금지합니다.<br/>
                            • <strong>허위 정보 기재:</strong> 가입 시 허위 정보를 입력할 경우 서비스 이용에 제한을 받을 수 있으며, 이벤트 당첨 취소 등의 불이익이 발생할 수 있습니다.<br/>
                            • <strong>상업적 홍보 및 도배:</strong> 승인되지 않은 광고물을 배포하거나 동일 내용을 반복 게시하는 행위는 제재 대상입니다.
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#334155', display: 'block', marginBottom: '4px' }}>3. 법적 책임 및 고지 사항</strong>
                            • <strong>저작권 준수:</strong> 콘텐츠를 무단 복제, 배포, 수정하여 상업적으로 이용하는 행위는 저작권법 위반에 해당합니다.<br/>
                            • <strong>서비스 중단:</strong> 시스템 점검 등으로 서비스가 일시 중단될 수 있으며, 이 경우 사전 공지를 통해 안내드립니다.<br/>
                            • <strong>약관 동의:</strong> 가입 완료 시 본 서비스의 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다.
                        </div>

                        <p style={{ marginTop: '8px', fontWeight: 600, color: '#dc2626' }}>
                            ※ 위 내용을 위반할 경우 이용 약관에 따라 서비스 이용 제한, 계정 삭제 및 민형사상의 법적 조치가 취해질 수 있습니다.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', cursor: 'pointer' }} onClick={() => setAgreed(!agreed)}>
                        <input 
                            type="checkbox" 
                            checked={agreed} 
                            onChange={(e) => setAgreed(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>
                            위 주의사항을 모두 확인하였으며, 이에 동의합니다.
                        </span>
                    </div>

                    {statusMessage && (
                        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>
                            {statusMessage}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ 
                            width: '100%', 
                            marginTop: '20px', 
                            padding: '14px',
                            opacity: isRegistering ? 0.7 : 1,
                            cursor: isRegistering ? 'not-allowed' : 'pointer'
                        }}
                        disabled={isRegistering}
                    >
                        {isRegistering ? '가입 처리 중...' : '가입하기'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    이미 계정이 있으신가요? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>로그인</Link>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
