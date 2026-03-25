import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const Login = () => {
    const navigate = useNavigate();
    const [loginId, setLoginId] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [debugStep, setDebugStep] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLoggingIn) return;

        const trimmedId = loginId.trim();
        const trimmedPassword = loginPassword.trim();

        if (!trimmedId || !trimmedPassword) {
            alert('아이디와 비밀번호를 모두 입력해 주세요.');
            return;
        }

        setIsLoggingIn(true);
        setDebugStep('시작 (V17)...');

        try {
            await Promise.race([
                (async () => {
                    let matchedUser = null;

                    setDebugStep('병렬 로딩 중 (V17)...');

                    // 1단계 & 2단계 병렬 실행
                    const [directResult, queryResult] = await Promise.all([
                        // 태스크 1: 직접 매칭
                        (async () => {
                            try {
                                const userDocRef = doc(db, 'users', trimmedId);
                                const userSnap = await getDoc(userDocRef);
                                if (userSnap.exists()) {
                                    const data = userSnap.data();
                                    if (data && data.password === trimmedPassword) {
                                        return { ...data, id: trimmedId, firebaseId: userSnap.id };
                                    }
                                }
                            } catch (e) { console.warn("Task 1 fail", e); }
                            return null;
                        })(),

                        // 태스크 2: 필드 매칭 (쿼리)
                        (async () => {
                            try {
                                const q = query(collection(db, 'users'), where('id', '==', trimmedId));
                                const querySnapshot = await getDocs(q);
                                let found = null;
                                querySnapshot.forEach((docSnap) => {
                                    const data = docSnap.data();
                                    if (data && data.password === trimmedPassword) {
                                        found = { ...data, firebaseId: docSnap.id };
                                        if (!found.id) found.id = trimmedId;
                                    }
                                });
                                return found;
                            } catch (e) { console.warn("Task 2 fail", e); }
                            return null;
                        })()
                    ]);

                    matchedUser = directResult || queryResult;

                    if (matchedUser) {
                        setDebugStep('완료! 이동 중...');
                        finalizeLogin(matchedUser);
                    } else {
                        setDebugStep('정보 불일치');
                        alert('아이디 또는 비밀번호가 일치하지 않습니다.');
                    }
                })(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("60초 시간 초과")), 60000))
            ]);

        } catch (error) {
            console.error("Login error (V17):", error);
            const errorMsg = error.message;
            setDebugStep(`오류: ${errorMsg}`);
            alert(`로그인 오류 [V17]: ${errorMsg}`);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const finalizeLogin = (userData) => {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        if (userData.role === 'admin') {
            localStorage.setItem('isAdmin', 'true');
            navigate('/admin');
        } else {
            navigate('/');
        }
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
            <h2 className="section-title">LOGIN</h2>
            <div style={{ maxWidth: '400px', margin: '0 auto', background: 'var(--surface)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input
                        type="text"
                        placeholder="아이디"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        disabled={isLoggingIn}
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        disabled={isLoggingIn}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ padding: '12px', borderRadius: '8px', fontWeight: 'bold' }}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? '처리 중...' : '로그인'}
                    </button>
                    {isLoggingIn && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '8px' }}>
                            {debugStep}
                        </div>
                    )}
                </form>
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.9rem' }}>
                    <Link to="/signup" style={{ color: 'var(--text-muted)' }}>회원가입</Link>
                    <span style={{ color: 'var(--border)' }}>|</span>
                    <Link to="/" style={{ color: 'var(--text-muted)' }}>아이디 찾기</Link>
                </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.1)', marginTop: '20px' }}>Build V17</div>
        </div>
    );
};

export default Login;
