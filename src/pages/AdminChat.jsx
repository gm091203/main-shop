import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

const AdminChat = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [selectedUserInfo, setSelectedUserInfo] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedChatUserId, setSelectedChatUserId] = useState(null);
    const [chatsPreview, setChatsPreview] = useState({}); // Stores the latest message and unread count per user
    const messagesEndRef = useRef(null);
    const prevMessagesLengthRef = useRef(0);
    const selectedChatUserIdRef = useRef(selectedChatUserId);

    useEffect(() => {
        // 1. 유저 리스트 실시간 감시 (isAdmin이 아닌 유저만)
        const qUsers = query(collection(db, 'users'), where('isAdmin', '!=', true));
        const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
            const userList = [];
            snapshot.forEach(doc => {
                userList.push({ ...doc.data(), firebaseId: doc.id });
            });
            setUsers(userList);
        });

        // 2. 전체 채팅 미리보기용 실시간 감시
        // 모든 메시지를 감시하며 유저별 마지막 메시지와 안읽은 개수 계산
        const qAllChats = query(collection(db, 'chats'), orderBy('createdAt', 'desc'));
        const unsubscribeAllChats = onSnapshot(qAllChats, (snapshot) => {
            const previews = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                const uid = data.userId;
                if (!uid) return;

                if (!previews[uid]) {
                    previews[uid] = {
                        lastMessage: data.text,
                        time: data.time,
                        unreadCount: 0
                    };
                }
                if (data.sender === 'user' && !data.isRead) {
                    previews[uid].unreadCount += 1;
                }
            });
            setChatsPreview(previews);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeAllChats();
        };
    }, []);

    // 3. 선택된 유저의 채팅 메시지 실시간 감시
    useEffect(() => {
        if (!selectedChatUserId) {
            setMessages([]);
            return;
        }

        const qActiveChat = query(
            collection(db, 'chats'),
            where('userId', '==', selectedChatUserId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribeActive = onSnapshot(qActiveChat, (snapshot) => {
            const activeMsgs = [];
            snapshot.forEach(doc => {
                activeMsgs.push({ ...doc.data(), firebaseId: doc.id });
            });
            setMessages(activeMsgs);
        });

        return () => unsubscribeActive();
    }, [selectedChatUserId]);

    // Load active messages whenever selected chat user changes
    useEffect(() => {
        if (selectedChatUserId) {
            loadMessages(selectedChatUserId);
        }
    }, [selectedChatUserId]);

    // 관리자가 채팅창을 열어 메시지를 확인하면 '읽음' 처리
    useEffect(() => {
        const markAsRead = async () => {
            const unreadUserMessages = messages.filter(msg => msg.sender === 'user' && !msg.isRead);
            if (unreadUserMessages.length > 0) {
                for (const msg of unreadUserMessages) {
                    if (msg.firebaseId) {
                        try {
                            await updateDoc(doc(db, 'chats', msg.firebaseId), { isRead: true });
                        } catch (e) {
                            console.error("Failed to update isRead:", e);
                        }
                    }
                }
            }
        };

        if (selectedChatUserId) {
            markAsRead();
        }
    }, [messages.length, selectedChatUserId]);

    // 새로운 메시지가 추가되었을 때만 스크롤을 맨 아래로 이동
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, selectedChatUserId]); // selectedChatUserId 추가하여 방 변경 시에도 하단이동 보장

    const handleSend = async () => {
        if (!inputValue.trim() || !selectedChatUserId) return;
        
        const activeUser = users.find(u => (u.uid || u.id) === selectedChatUserId);
        
        const newMsg = {
            sender: 'bot',
            userId: selectedChatUserId,
            userName: activeUser ? activeUser.name : '고객',
            text: inputValue,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString(),
            isRead: false
        };

        try {
            await addDoc(collection(db, 'chats'), newMsg);
            setInputValue('');
        } catch (error) {
            console.error("Error sending bot message:", error);
            alert('메시지 전송 중 오류가 발생했습니다.');
        }
    };

    const clearChat = async () => {
        if (window.confirm('채팅 내역을 초기화하시겠습니까? (DB에서 해당 유저의 모든 대화가 삭제됩니다)')) {
            try {
                const q = query(collection(db, 'chats'), where('userId', '==', selectedChatUserId));
                const snap = await getDocs(q);
                for (const d of snap.docs) {
                    await deleteDoc(doc(db, 'chats', d.id));
                }
                setMessages([]);
                prevMessagesLengthRef.current = 0;
            } catch (error) {
                console.error("Error clearing chat:", error);
                alert('초기화 중 오류가 발생했습니다.');
            }
        }
    };

    const customers = users.filter(u => !u.isAdmin);

    return (
        <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px', position: 'relative' }}>
            <div className="container" style={{ maxWidth: '1200px', height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '16px', flexShrink: 0 }}>
                    <div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>ADMIN CHAT CENTER</h1>
                        <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '0.9rem' }}>실시간 멀티비전 고객 응대 패널</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link
                            to="/admin"
                            title="대시보드 홈"
                            style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid #334155', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            대시보드로 돌아가기
                        </Link>
                    </div>
                </header>

                <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>

                    {/* Sidebar: User List (KakaoTalk Style) */}
                    <div style={{
                        width: '320px',
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        border: '1px solid #334155',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        flexShrink: 0
                    }}>
                        {/* Header removed based on user request */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                            {customers.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>가입된 고객이 없습니다.</div>
                            ) : (
                                customers.map(u => {
                                    const uid = u.uid || u.id;
                                    const isSelected = selectedChatUserId === uid;
                                    const preview = chatsPreview[uid] || { lastMessage: '', time: '', unreadCount: 0 };

                                    return (
                                        <div
                                            key={uid}
                                            onClick={() => setSelectedChatUserId(uid)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '16px',
                                                cursor: 'pointer',
                                                backgroundColor: isSelected ? 'rgba(234, 88, 12, 0.15)' : 'transparent',
                                                borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent',
                                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                                        >
                                            <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginRight: '16px', flexShrink: 0 }}>
                                                👤
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: isSelected || preview.unreadCount > 0 ? 'bold' : 'normal', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {u.name || u.id}
                                                    </h3>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', marginLeft: '8px' }}>{preview.time}</span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: preview.unreadCount > 0 ? '#cbd5e1' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {preview.lastMessage}
                                                </p>
                                            </div>
                                            {preview.unreadCount > 0 && (
                                                <div style={{
                                                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                                                    backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold',
                                                    width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                }}>
                                                    {preview.unreadCount > 99 ? '99+' : preview.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Main Chat Area */}
                    <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                        {/* Chat Header */}
                        <div style={{ padding: '16px 24px', backgroundColor: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {selectedChatUserId ? (
                                (() => {
                                    const activeUser = users.find(u => (u.uid || u.id) === selectedChatUserId);
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👤</div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{activeUser ? (activeUser.name || activeUser.id) : '고객'}</h3>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {activeUser ? activeUser.id : 'unknown'}</span>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <div style={{ color: '#94a3b8' }}>대화할 고객을 선택해주세요.</div>
                            )}

                            {selectedChatUserId && (
                                <button
                                    onClick={clearChat}
                                    style={{ padding: '6px 12px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                    내역 초기화
                                </button>
                            )}
                        </div>

                        {/* Chat Body */}
                        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#0f172a' }}>
                            {!selectedChatUserId ? (
                                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexDirection: 'column', gap: '16px' }}>
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    <p>대화하실 고객을 좌측 목록에서 선택해주세요.</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>대화 내역이 없습니다.</div>
                            ) : (
                                messages.map((msg) => (
                                    msg.sender === 'system' ? (
                                        <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '16px 0', width: '100%' }}>
                                            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '12px 24px', borderRadius: '20px', fontSize: '0.85rem', textAlign: 'center', border: '1px solid #334155', whiteSpace: 'pre-line' }}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={msg.id} style={{
                                            display: 'flex',
                                            flexDirection: msg.sender === 'bot' ? 'row-reverse' : 'row',
                                            alignItems: 'flex-end',
                                            gap: '12px'
                                        }}>
                                            <div
                                                onClick={() => {
                                                    if (msg.sender === 'user') {
                                                        setSelectedUserInfo(msg.userInfo || {
                                                            name: msg.name || '알 수 없는 고객',
                                                            id: '정보 없음',
                                                            phone: '정보 없음',
                                                            address: '정보 없음',
                                                            detailAddress: ''
                                                        });
                                                    }
                                                }}
                                                style={{
                                                    width: '40px', height: '40px', borderRadius: '14px',
                                                    backgroundColor: msg.sender === 'bot' ? 'var(--primary)' : '#3b82f6',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                                                    flexShrink: 0,
                                                    cursor: msg.sender === 'user' ? 'pointer' : 'default',
                                                    border: msg.sender === 'user' ? '2px solid transparent' : 'none',
                                                    transition: 'all 0.2s',
                                                    boxShadow: msg.sender === 'user' ? '0 0 0 2px rgba(255,255,255,0.1)' : 'none'
                                                }}>
                                                {msg.sender === 'bot' ? '🎧' : '👤'}
                                            </div>
                                            <div style={{ maxWidth: '65%' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', textAlign: msg.sender === 'bot' ? 'right' : 'left' }}>
                                                    {msg.sender === 'bot' ? '상담원 (나)' : (msg.name || '고객')}
                                                </div>
                                                <div style={{
                                                    padding: '12px 16px',
                                                    borderRadius: msg.sender === 'bot' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                                    backgroundColor: msg.sender === 'bot' ? 'var(--primary)' : '#1e293b',
                                                    color: '#f8fafc',
                                                    border: msg.sender === 'bot' ? 'none' : '1px solid #334155',
                                                    fontSize: '0.95rem',
                                                    lineHeight: '1.5',
                                                    whiteSpace: 'pre-line',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}>
                                                    {msg.text}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'bot' ? 'flex-end' : 'flex-start', justifyContent: 'flex-end', marginTop: '4px' }}>
                                                    {!msg.isRead && msg.sender === 'bot' && (
                                                        <span style={{ fontSize: '0.75rem', color: '#facc15', fontWeight: 'bold', marginBottom: '2px' }}>1</span>
                                                    )}
                                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                        {msg.time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div style={{ padding: '20px', backgroundColor: '#1e293b', borderTop: '1px solid #334155', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                disabled={!selectedChatUserId}
                                placeholder={selectedChatUserId ? "메시지를 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)" : "고객을 먼저 선택해주세요."}
                                style={{
                                    flex: 1,
                                    height: '60px',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #334155',
                                    backgroundColor: selectedChatUserId ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.2)',
                                    color: 'white',
                                    outline: 'none',
                                    resize: 'none',
                                    fontSize: '0.95rem',
                                    opacity: selectedChatUserId ? 1 : 0.5,
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = '#334155'}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!selectedChatUserId || !inputValue.trim()}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    backgroundColor: (!selectedChatUserId || !inputValue.trim()) ? '#334155' : 'var(--primary)',
                                    color: (!selectedChatUserId || !inputValue.trim()) ? '#94a3b8' : 'white',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    cursor: (!selectedChatUserId || !inputValue.trim()) ? 'not-allowed' : 'pointer',
                                    border: 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px' }}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>전송</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Info Modal Overlay */}
            {selectedUserInfo && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
                    onClick={() => setSelectedUserInfo(null)}
                >
                    <div
                        style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '24px', width: '400px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                                👤
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'white' }}>{selectedUserInfo.name}</h2>
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>고객 상세 정보</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.95rem', color: '#cbd5e1' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                <span style={{ color: '#94a3b8' }}>아이디</span>
                                <span style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{selectedUserInfo.id}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                <span style={{ color: '#94a3b8' }}>연락처</span>
                                <span>{selectedUserInfo.phone || '미입력'}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'start', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                <span style={{ color: '#94a3b8' }}>주소</span>
                                <span style={{ lineHeight: '1.4' }}>{selectedUserInfo.address} {selectedUserInfo.detailAddress}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedUserInfo(null)}
                            style={{ width: '100%', marginTop: '32px', padding: '14px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'background 0.2s' }}
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

export default AdminChat;
