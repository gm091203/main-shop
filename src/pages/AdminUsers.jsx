import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, deleteDoc, getDocs, where } from 'firebase/firestore';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userList = [];
            snapshot.forEach(doc => {
                userList.push({ ...doc.data(), firebaseId: doc.id });
            });
            setUsers(userList);
        });

        return () => unsubscribe();
    }, []);

    const handleDeleteUser = async (userFirebaseId) => {
        if (window.confirm('정말로 이 회원을 탈퇴 처리하시겠습니까? 모든 회원 정보가 영구적으로 삭제됩니다.')) {
            const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            if (currentUserStr) {
                const currentUser = JSON.parse(currentUserStr);
                const isAdmin = currentUser.isAdmin === true;
                // userFirebaseId는 Firestore의 document ID라고 가정 (firebaseId 필드 사용)
                if (isAdmin && (currentUser.uid || currentUser.id) === userFirebaseId) {
                    alert('관리자 계정은 삭제할 수 없습니다.');
                    return;
                }
            }
            try {
                // 1. 유저 문서 삭제
                await deleteDoc(doc(db, 'users', userFirebaseId));
                
                // 2. 해당 사용자의 채팅 기록도 삭제
                const qChat = query(collection(db, 'chats'), where('userId', '==', userFirebaseId));
                const chatSnap = await getDocs(qChat);
                for (const d of chatSnap.docs) {
                    await deleteDoc(doc(db, 'chats', d.id));
                }

                setSelectedUser(null);
                alert('회원 탈퇴 처리가 완료되었습니다.');

            } catch (e) {
                console.error("Failed to delete user:", e);
                alert('탈퇴 처리 중 오류가 발생했습니다.');
            }
        }
    };

    return (
        <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '40px 20px', position: 'relative' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button
                            onClick={() => navigate('/admin')}
                            style={{
                                background: 'transparent',
                                border: '1px solid #334155',
                                color: '#cbd5e1',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1e293b';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#cbd5e1';
                            }}
                        >
                            <span>&larr;</span> 대시보드로 돌아가기
                        </button>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>전체 고객 관리</h1>
                            <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>등록된 모든 회원의 상세 정보를 조회합니다.</p>
                        </div>
                    </div>
                </header>

                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #334155',
                    minHeight: '400px'
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #334155' }}>
                                    <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 600 }}>이름</th>
                                    <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 600 }}>아이디</th>
                                    <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 600 }}>연락처</th>
                                    <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 600 }}>주소</th>
                                    <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>상세</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? (
                                    users.map((user, idx) => (
                                        <tr
                                            key={user.firebaseId || idx}
                                            style={{
                                                borderBottom: '1px solid #334155',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '16px', color: 'white', fontWeight: 500 }}>{user.name}</td>
                                            <td style={{ padding: '16px', color: '#cbd5e1' }}>{user.id}</td>
                                            <td style={{ padding: '16px', color: '#cbd5e1' }}>{user.phone || '미입력'}</td>
                                            <td style={{ padding: '16px', color: '#e2e8f0' }}>{user.address || '정보 없음'}</td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    style={{
                                                        backgroundColor: '#334155',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 16px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                                                >
                                                    정보 보기
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                            등록된 회원이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* User Detail Modal Overlay */}
            {selectedUser && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setSelectedUser(null)}
                >
                    <div
                        style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', width: '500px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', zIndex: 1001 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.4rem', color: 'white', margin: 0 }}>회원 상세 정보</h2>
                            <button
                                onClick={() => handleDeleteUser(selectedUser.firebaseId)}
                                style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                                탈퇴
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* 기본 정보 */}
                            <section>
                                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '12px', fontWeight: 600 }}>계정 정보</h3>
                                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', fontSize: '0.95rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', marginBottom: '8px' }}>
                                        <span style={{ color: '#94a3b8' }}>아이디</span>
                                        <span style={{ color: 'white' }}>{selectedUser.id}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr' }}>
                                        <span style={{ color: '#94a3b8' }}>비밀번호</span>
                                        <span style={{ color: '#64748b' }}>{selectedUser.password}</span>
                                    </div>
                                </div>
                            </section>

                            {/* 인적 사항 */}
                            <section>
                                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '12px', fontWeight: 600 }}>인적 사항</h3>
                                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', fontSize: '0.95rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', marginBottom: '8px' }}>
                                        <span style={{ color: '#94a3b8' }}>이름</span>
                                        <span style={{ color: 'white' }}>{selectedUser.name}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', marginBottom: '8px' }}>
                                        <span style={{ color: '#94a3b8' }}>주민번호</span>
                                        <span style={{ color: 'white' }}>{selectedUser.ssnFront}-{selectedUser.ssnBack}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr' }}>
                                        <span style={{ color: '#94a3b8' }}>연락처</span>
                                        <span style={{ color: 'white' }}>{selectedUser.phone || '미입력'}</span>
                                    </div>
                                </div>
                            </section>

                            {/* 배송 정보 */}
                            <section>
                                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '12px', fontWeight: 600 }}>배송 정보</h3>
                                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', fontSize: '0.95rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr' }}>
                                        <span style={{ color: '#94a3b8' }}>주소</span>
                                        <span style={{ color: 'white', lineHeight: 1.4 }}>
                                            {selectedUser.address}<br />
                                            {selectedUser.detailAddress}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <button
                            onClick={() => setSelectedUser(null)}
                            style={{ width: '100%', marginTop: '30px', padding: '14px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#475569'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#334155'}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
