import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dummyProducts } from '../pages/Home';
import './Header.css';

const CHO_HANGUL = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const getChosung = (str) => {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 44032;
    if (code > -1 && code < 11172) {
      result += CHO_HANGUL[Math.floor(code / 588)];
    } else {
      result += str.charAt(i);
    }
  }
  return result;
};

const Header = ({ setIsChatOpen }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    // sessionStorage (일반 사용자) 또는 localStorage (관리자) 중 로그인 상태 확인
    const sessionLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const localLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    // 로그인 상태 중 하나라도 참이면 로그인됨
    const currentlyLoggedIn = sessionLoggedIn || localLoggedIn;
    setIsLoggedIn(currentlyLoggedIn);

    // 관리자가 아닌데 현재 유저 정보가 sessionStorage에 있고 DB에서는 삭제된 경우 (예외처리)
    if (sessionLoggedIn && !localLoggedIn) {
      try {
        const currentUserData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        // 현재 세션의 유저가 DB에 없으면서 관리자가 아니면 강제 로그아웃
        const userExists = users.some(u => u.uid === currentUserData.uid || u.id === currentUserData.id);

        if (!userExists && currentUserData.id && !currentUserData.isAdmin) {
          sessionStorage.removeItem('isLoggedIn');
          sessionStorage.removeItem('currentUser');
          setIsLoggedIn(false);
          if (window.location.pathname !== '/' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
            alert('유효하지 않은 계정입니다. 다시 로그인해주세요.');
            navigate('/');
          }
        }
      } catch (err) {
        // parsing error ignore
      }
    }
  };

  useEffect(() => {
    // 1. 컴포넌트 마운트 시 즉시 체크
    checkLoginStatus();

    // 2. 다른 탭이나 창에서 변경사항이 있을 때 (storage 이벤트)
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. 같은 창 안에서 커스텀 이벤트(Login.js 등에서 트리거)가 발생했을 때
    const handleCustomStorageChange = () => {
      checkLoginStatus();
    };
    window.addEventListener('localStorageChange', handleCustomStorageChange);
    // Login.jsx에서 기본 storage 이벤트를 dispatch 하도록 만들어두었음

    // 경로 변경 시 팝업 닫기 및 로그인 체크
    setIsSettingsOpen(false);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    // Determine which storage holds the current session and clear it
    const hasSession = !!sessionStorage.getItem('isLoggedIn');
    const hasLocal = !!localStorage.getItem('isLoggedIn');
    if (hasSession) {
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('currentUser');
    }
    if (hasLocal) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
    }

    setIsLoggedIn(false);

    // App.js 등에서 변경사항을 감지할 수 있도록 이벤트 발생
    window.dispatchEvent(new Event('storage'));

    navigate('/');
  };

  return (
    <header className="header shadow-sm">
      <div className="container header-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            {isSettingsOpen && (
              <div className="settings-dropdown animate-fade-in" style={{
                position: 'absolute', top: '100%', left: '0', marginTop: '12px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 0', minWidth: '160px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', zIndex: 1000
              }}>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
                    if (!isLoggedIn) {
                      alert('로그인이 필요한 서비스입니다.');
                      navigate('/login');
                    } else {
                      navigate('/mypage');
                    }
                    setIsSettingsOpen(false);
                  }}
                >내정보</button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
                    if (!isLoggedIn) {
                      alert('로그인이 필요한 서비스입니다.');
                      navigate('/login');
                    } else {
                      navigate('/orderstatus');
                    }
                    setIsSettingsOpen(false);
                  }}
                >진행상태</button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    if (setIsChatOpen) setIsChatOpen(true);
                    setIsSettingsOpen(false);
                  }}
                >고객센터</button>
              </div>
            )}
          </div>

          <Link to="/" className="logo gradient-text" style={{ fontSize: '1.5rem', fontWeight: 800, fontStyle: 'italic', letterSpacing: '-0.5px', paddingRight: '4px' }}>
            <span>ZEO'S SHOP</span>
          </Link>
        </div>
        <nav className="nav-menu" style={{ alignItems: 'center' }}>
          <div style={{ position: 'relative', marginRight: '8px' }}>
            <input
              type="text"
              placeholder="무엇을 찾으시나요?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim().length > 0) {
                  setIsSearchFocused(false);
                  navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                }
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => { setTimeout(() => setIsSearchFocused(false), 200); }}
              style={{ padding: '8px 16px', paddingRight: '36px', borderRadius: '20px', border: `1px solid ${isSearchFocused ? 'var(--primary)' : 'var(--border)'}`, background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', outline: 'none', width: '220px', fontSize: '0.9rem', transition: 'border-color 0.2s' }}
            />
            <svg style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            
            {/* Autocomplete Dropdown */}
            {isSearchFocused && searchTerm.trim().length > 0 && (
                <div className="animate-fade-in" style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '8px 0', maxHeight: '300px', overflowY: 'auto',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', zIndex: 1000
                }}>
                    {dummyProducts.filter(p => {
                        const searchChosung = getChosung(searchTerm.replace(/\s+/g, '').toLowerCase());
                        const searchNormal = searchTerm.replace(/\s+/g, '').toLowerCase();
                        const targetChosung = getChosung(p.name.replace(/\s+/g, '').toLowerCase());
                        const targetNormal = p.name.replace(/\s+/g, '').toLowerCase();
                        return targetChosung.includes(searchChosung) || targetNormal.includes(searchNormal);
                    }).map(p => (
                        <div 
                            key={p.id}
                            onClick={() => {
                                navigate(`/product/${p.id}`);
                                setSearchTerm('');
                                setIsSearchFocused(false);
                            }}
                            style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(234, 88, 12, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span style={{ fontSize: '0.9rem' }}>{p.name}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.price.toLocaleString()}원</span>
                        </div>
                    ))}
                    {dummyProducts.filter(p => {
                        const searchChosung = getChosung(searchTerm.replace(/\s+/g, '').toLowerCase());
                        const searchNormal = searchTerm.replace(/\s+/g, '').toLowerCase();
                        const targetChosung = getChosung(p.name.replace(/\s+/g, '').toLowerCase());
                        const targetNormal = p.name.replace(/\s+/g, '').toLowerCase();
                        return targetChosung.includes(searchChosung) || targetNormal.includes(searchNormal);
                    }).length === 0 && (
                        <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>검색 결과가 없습니다.</div>
                    )}
                </div>
            )}
          </div>
          {isLoggedIn ? (
            <>
              <button onClick={handleLogout} className="btn nav-btn" style={{ background: 'transparent', color: 'var(--text-muted)' }}>로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline nav-btn">로그인</Link>
              <Link to="/signup" className="btn btn-primary nav-btn">회원가입</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
