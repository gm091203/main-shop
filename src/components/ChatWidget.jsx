import { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';

const ChatWidget = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    // Helper to get chat storage key for current logged-in user
    const getChatKey = () => {
        const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (!currentUserStr) return null;
        const currentUser = JSON.parse(currentUserStr);
        const uid = currentUser.uid || currentUser.id;
        return uid ? `chat_${uid}` : null;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (!currentUserStr) return;
        const currentUser = JSON.parse(currentUserStr);
        const uid = currentUser.id;

        // Firestore에서 실시간으로 메시지 가져오기
        const q = query(
            collection(db, 'chats'),
            where('userId', '==', uid),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatMessages = [];
            snapshot.forEach((doc) => {
                chatMessages.push({ ...doc.data(), firebaseId: doc.id });
            });
            
            if (chatMessages.length === 0) {
                // 초기 환영 메시지 (Firestore에 없으면 로컬 상태로만 유지하거나 DB에 생성 가능)
                setMessages([{
                    id: 'welcome',
                    sender: 'bot',
                    text: "안녕하세요! ZEO'S SHOP 고객센터입니다. 🏍️\n무엇을 도와드릴까요?",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            } else {
                setMessages(chatMessages);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isOpen && messages.length > 0) {
            scrollToBottom();

            // 관리자가 보낸 메시지(bot) 읽음 처리
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
        
        const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (!currentUserStr) {
            alert('로그인된 사용자를 찾을 수 없습니다.');
            return;
        }
        
        const currentUser = JSON.parse(currentUserStr);
        const newUserMsg = {
            sender: 'user',
            userId: currentUser.id,
            userName: currentUser.name,
            text: inputValue,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString(),
            isRead: false
        };

        try {
            await addDoc(collection(db, 'chats'), newUserMsg);
            setInputValue('');
        } catch (error) {
            console.error("Error sending message:", error);
            alert('메시지 전송 중 오류가 발생했습니다.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="shadow-lg animate-fade-in" style={{
            position: 'fixed',
            bottom: '100px',
            right: '30px',
            width: '350px',
            height: '500px',
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 10000,
            border: '1px solid var(--border)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary), #D97706)',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>🎧</span>
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>고객센터</h3>
                        <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>보통 5분 내 응답</span>
                    </div>
                </div>
                <button onClick={onClose} style={{ color: 'white', background: 'transparent', padding: '4px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            {/* Chat Area */}
            <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backgroundColor: 'rgba(0,0,0,0.2)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '12px' }}>
                        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>

                {messages.map((msg) => (
                    msg.sender === 'system' ? (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0', width: '100%' }}>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '16px', fontSize: '0.8rem', textAlign: 'center', whiteSpace: 'pre-line' }}>
                                {msg.text}
                            </div>
                        </div>
                    ) : (
                        <div key={msg.id} style={{
                            display: 'flex',
                            flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                            alignItems: 'flex-end',
                            gap: '8px'
                        }}>
                            {msg.sender === 'bot' && (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    🎧
                                </div>
                            )}
                            <div style={{
                                maxWidth: '70%',
                                padding: '10px 14px',
                                borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--surface)',
                                color: msg.sender === 'user' ? 'white' : 'var(--text-main)',
                                border: msg.sender === 'bot' ? '1px solid var(--border)' : 'none',
                                fontSize: '0.90rem',
                                lineHeight: '1.4',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-line'
                            }}>
                                {msg.text}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', justifyContent: 'flex-end', marginBottom: '4px' }}>
                                {!msg.isRead && msg.sender === 'user' && (
                                    <span style={{ fontSize: '0.75rem', color: '#facc15', fontWeight: 'bold', marginBottom: '2px' }}>1</span>
                                )}
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {msg.time}
                                </span>
                            </div>
                        </div>
                    )
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface)',
                display: 'flex',
                gap: '8px'
            }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="메시지를 입력해주세요..."
                    style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '20px',
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '0.9rem'
                    }}
                />
                <button
                    onClick={handleSend}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: inputValue.trim() ? 'var(--primary)' : 'var(--border)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
    );
};

export default ChatWidget;
