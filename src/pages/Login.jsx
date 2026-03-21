import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Login = () => {
    const navigate = useNavigate();
    const [loginData, setLoginData] = useState({ id: '', password: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // 아이디로 유저 찾기
            const q = query(collection(db, 'users'), where('id', '==', loginData.id));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                alert('존재하지 않는 계정입니다.');
                return;
            }

            let matchedUser = null;
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                if (userData.password === loginData.password) {
                    matchedUser = { ...userData, firebaseId: doc.id };
                }
            });

            if (matchedUser) {
                // 로그인 성공: 토큰(isLoggedIn) 및 현재 접속 유저 정보 저장
                if (matchedUser.isAdmin) {
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('currentUser', JSON.stringify(matchedUser));
                } else {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('currentUser', JSON.stringify(matchedUser));
                }

                window.dispatchEvent(new Event('storage'));
                navigate('/');
            } else {
                alert('비밀번호가 일치하지 않습니다.');
            }
        } catch (error) {
            console.error("Error logging in:", error);
            alert('로그인 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="container animate-fade-in auth-container">
            <div className="auth-card" style={{ maxWidth: '400px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px', textAlign: 'center' }}>로그인</h2>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label className="input-label">아이디</label>
                        <input type="text" name="id" className="input-field" placeholder="아이디를 입력하세요" value={loginData.id} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">비밀번호</label>
                        <input type="password" name="password" className="input-field" placeholder="비밀번호를 입력하세요" value={loginData.password} onChange={handleChange} required />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px', padding: '14px' }}>
                        로그인
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    계정이 없으신가요? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>회원가입</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
