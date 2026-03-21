import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const SignupPayment = () => {
    const [referralCode, setReferralCode] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // 회원가입 폼에서 넘어온 데이터
    const signupData = location.state?.signupData;

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!signupData) {
            alert('잘못된 접근입니다. 회원가입 폼부터 다시 시도해주세요.');
            navigate('/signup');
            return;
        }

        if (isProcessing) return;

        setIsProcessing(true);
        setStatusMessage('가입 처리 중...');

        try {
            console.log("Starting signup process for ID:", signupData.id);
            
            // 중복 아이디 최종 체크 (타임아웃 적용 고려)
            const q = query(collection(db, 'users'), where('id', '==', signupData.id));
            
            // getDocs가 너무 오래 걸릴 경우를 대비해 10초 타임아웃
            const querySnapshot = await Promise.race([
                getDocs(q),
                new Promise((_, reject) => setTimeout(() => reject(new Error("조회 시간 초과")), 10000))
            ]);
            
            if (!querySnapshot.empty) {
                alert('이미 존재하는 아이디입니다. 다른 아이디를 사용해주세요.');
                setIsProcessing(false);
                setStatusMessage('중복된 아이디입니다.');
                return;
            }

            // Firestore에 유저 정보 저장
            const newUser = {
                ...signupData,
                createdAt: new Date().toISOString(),
                isAdmin: false 
            };
            
            delete newUser.passwordConfirm;

            console.log("Saving user data to Firestore...");
            await Promise.race([
                addDoc(collection(db, 'users'), newUser),
                new Promise((_, reject) => setTimeout(() => reject(new Error("저장 시간 초과")), 10000))
            ]);

            console.log("Signup successful!");
            setStatusMessage('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error("Critical Signup Error:", error);
            alert(`회원가입 처리 중 오류가 발생했습니다: ${error.message}`);
            setIsProcessing(false);
            setStatusMessage(`오류 발생: ${error.message}`);
        }
    };

    return (
        <div className="container animate-fade-in auth-container">
            <div className="auth-card" style={{ maxWidth: '480px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '16px' }}>회원가입 완료 / 멤버십 안내</h2>
                {signupData && <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{signupData.name}님의 계정 등록을 위한 마지막 단계입니다.</p>}

                <div style={{ padding: '24px', background: 'rgba(234, 88, 12, 0.1)', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--primary)' }}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>ZEO'S SHOP 프리미엄 멤버십</p>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 800 }}>(가입 즉시 혜택 제공)</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>무료 가입 이벤트 진행 중!</p>
                </div>

                <form onSubmit={handlePayment}>
                    <div className="input-group" style={{ textAlign: 'left' }}>
                        <label className="input-label">추천인 코드 (선택)</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="추천인 코드가 있다면 입력해주세요"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                        />
                    </div>

                    {statusMessage && (
                        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', fontSize: '0.95rem', fontWeight: 500 }}>
                            {statusMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            marginTop: '24px',
                            padding: '16px',
                            fontSize: '1.1rem',
                            opacity: isProcessing ? 0.7 : 1,
                            cursor: isProcessing ? 'not-allowed' : 'pointer'
                        }}
                        disabled={isProcessing}
                    >
                        {isProcessing ? '처리 중...' : '가입 완료하기'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignupPayment;
