import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
    const [isIdChecked, setIsIdChecked] = useState(false);
    const [idMessage, setIdMessage] = useState({ text: '', type: '' });

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

        try {
            const q = query(collection(db, 'users'), where('id', '==', formData.id));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setIsIdChecked(false);
                setIdMessage({ text: '이미 사용 중인 아이디입니다.', type: 'error' });
            } else {
                setIsIdChecked(true);
                setIdMessage({ text: '사용 가능한 아이디입니다.', type: 'success' });
            }
        } catch (e) {
            console.error("Failed to check ID duplication:", e);
            alert('중복 확인 중 오류가 발생했습니다.');
        }
    };

    const handleSignup = (e) => {
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

        // 입력받은 회원가입 정보를 가지고 결제 페이지로 이동
        navigate('/signup/payment', { state: { signupData: formData } });
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
                                style={{
                                    padding: '0 15px',
                                    backgroundColor: '#334155',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                중복 확인
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

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px', padding: '14px' }}>
                        가입하기
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
