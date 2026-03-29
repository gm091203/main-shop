import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, getDocs } from 'firebase/firestore';

const ChatWidget = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Helper to get chat storage key for current logged-in user
    const getChatKey = () => {
        const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (!currentUserStr) return null;
        try {
            const currentUser = JSON.parse(currentUserStr);
            const uid = currentUser.uid || currentUser.id;
            return uid ? `chat_${uid}` : null;
        } catch (e) {
            return null;
        }
    };

    const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    const isLoggedIn = !!currentUserStr;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (!currentUserStr) return;
        const currentUser = JSON.parse(currentUserStr);
        const uid = currentUser.uid || currentUser.id;

        const fetchChatMessages = async () => {
            if (!uid) return;
            try {
                const q = query(collection(db, 'chats'), where('userId', '==', uid));
                const snapshot = await getDocs(q);
                const chatMessages = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    chatMessages.push({ ...data, firebaseId: doc.id, id: doc.id });
                });

                chatMessages.sort((a, b) => {
                    const tA = new Date(a.createdAt || 0).getTime();
                    const tB = new Date(b.createdAt || 0).getTime();
                    return (tA || 0) - (tB || 0);
                });
                
                setMessages(chatMessages);
            } catch (error) {
                console.error("Error fetching chat messages (V17):", error);
            }
        };

        if (isOpen && isLoggedIn) {
            fetchChatMessages();
            const interval = setInterval(fetchChatMessages, 4000);
            return () => clearInterval(interval);
        }
    }, [isOpen, isLoggedIn]);

    useEffect(() => {
        if (isOpen && messages.length > 0) {
            scrollToBottom();
            const markAsRead = async () => {
                const unreadBotMessages = messages.filter(msg => msg.sender === 'bot' && !msg.isRead);
                if (unreadBotMessages.length > 0) {
                    for (const msg of unreadBotMessages) {
                        if (msg.firebaseId) {
                            await updateDoc(doc(db, 'chats', msg.firebaseId), { isRead: true });
                        }
                    }
                }
            };
            markAsRead();
        }
    }, [messages.length, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        if (!isLoggedIn) return;
        
        const currentUser = JSON.parse(currentUserStr);
        const newUserMsg = {
            sender: 'user',
            userId: currentUser.uid || currentUser.id,
            userName: currentUser.name,
            text: inputValue,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString(),
            isRead: false
        };

        try {
            setMessages(prev => [...prev, { ...newUserMsg, id: Date.now() }]);
            setInputValue('');

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('TIMEOUT_ERROR')), 10000);
            });

            await Promise.race([
                addDoc(collection(db, 'chats'), newUserMsg),
                timeoutPromise
            ]);
        } catch (error) {
            console.error("Error sending message (V17):", error);
            alert(`[오류 V17] ${error.message === 'TIMEOUT_ERROR' ? '서버 응답 시간 초과' : error.message}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="chat-widget shadow-2xl animate-scale-in" style={{
            position: 'fixed',
            bottom: '100px',
            left: '30px',
            width: '360px',
            height: '500px',
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10001,
            border: '1px solid var(--border)',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }}></div>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>ZEO'S SHOP 고객지원</span>
                </div>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc' }}>
                {isLoggedIn && (
                    <div style={{ 
                        padding: '10px 14px', 
                        backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                        border: '1px solid rgba(16, 185, 129, 0.2)', 
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        color: '#065f46',
                        textAlign: 'center',
                        marginBottom: '4px'
                    }}>
                        <strong>고객센터 운영시간 안내</strong><br />
                        평일: 17:00 ~ 22:00<br />
                        주말 및 공휴일: 12:00 ~ 22:00
                    </div>
                )}
                {!isLoggedIn ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
                        <h4 style={{ color: '#1e293b', marginBottom: '8px' }}>로그인이 필요합니다</h4>
                        <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>고객센터 채팅을 이용하시려면<br />먼저 로그인을 해주세요.</p>
                        <button 
                            onClick={() => { onClose(); navigate('/login'); }}
                            style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                        >로그인하러 가기</button>
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎧</div>
                        <p style={{ fontSize: '0.9rem' }}>안녕하세요! 무엇을 도와드릴까요?<br />궁금하신 내용을 입력해주세요.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(0,0,0,0.05)', padding: '4px 12px', borderRadius: '12px' }}>
                                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        {messages.map((msg) => (
                            <div key={msg.id} style={{ display: 'flex', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
                                {msg.sender === 'bot' && (
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🎧</div>
                                )}
                                <div style={{ 
                                    maxWidth: '70%', padding: '10px 14px', borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                    backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'white',
                                    color: msg.sender === 'user' ? 'white' : '#1e293b',
                                    border: msg.sender === 'bot' ? '1px solid #e2e8f0' : 'none',
                                    fontSize: '0.9rem', lineHeight: '1.4', wordBreak: 'break-word', whiteSpace: 'pre-line'
                                }}>{msg.text}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                                    {!msg.isRead && msg.sender === 'user' && <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>1</span>}
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{msg.time}</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {isLoggedIn && (
                <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', gap: '8px' }}>
                    <input
                        type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="메시지를 입력해주세요..."
                        style={{ flex: 1, padding: '10px 16px', borderRadius: '20px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
                    />
                    <button
                        onClick={handleSend}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', background: inputValue.trim() ? 'var(--primary)' : '#e2e8f0', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
