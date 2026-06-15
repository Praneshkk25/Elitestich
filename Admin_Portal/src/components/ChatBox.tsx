'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Send, Image as ImageIcon, Mic, Square, Loader2 } from 'lucide-react';
import { ChatMessage } from '@/types/database';

interface ChatBoxProps {
    orderId: string;
    currentUserRole: 'customer' | 'tailor' | 'admin';
    currentUserId: string;
    currentUserName: string;
}

export default function ChatBox({ orderId, currentUserRole, currentUserId, currentUserName }: ChatBoxProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial setup and notifications
    useEffect(() => {
        // Request notification permission if not granted or denied
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const q = query(
            collection(db, `orders/${orderId}/messages`),
            orderBy('timestamp', 'asc')
        );

        let initialLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: ChatMessage[] = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            setMessages(msgs);
            
            // Handle notifications for new messages after initial load
            if (!initialLoad && snapshot.docChanges().length > 0) {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const newMsg = change.doc.data() as ChatMessage;
                        // Don't notify for our own messages
                        if (newMsg.senderId !== currentUserId) {
                            if ('Notification' in window && Notification.permission === 'granted') {
                                const senderDisplay = newMsg.senderRole === 'tailor' && currentUserRole === 'customer' 
                                    ? 'Your Tailor' 
                                    : newMsg.senderName;
                                    
                                let bodyText = newMsg.text;
                                if (newMsg.imageUrl) bodyText = 'Sent an image';
                                if (newMsg.audioUrl) bodyText = 'Sent a voice message';
                                
                                new Notification(`New message from ${senderDisplay}`, {
                                    body: bodyText,
                                    icon: '/favicon.ico' // fallback icon
                                });
                            }
                        }
                    }
                });
            }
            initialLoad = false;
        });

        return () => unsubscribe();
    }, [orderId, currentUserId, currentUserRole]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() && !isUploading) return;

        const textToSend = newMessage.trim();
        setNewMessage(''); // optimistic clear

        try {
            await addDoc(collection(db, `orders/${orderId}/messages`), {
                senderId: currentUserId,
                senderName: currentUserName,
                senderRole: currentUserRole,
                text: textToSend,
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileRef = ref(storage, `order_chats/${orderId}/${Date.now()}_${file.name}`);
            const uploadTask = await uploadBytesResumable(fileRef, file);
            const downloadUrl = await getDownloadURL(uploadTask.ref);

            await addDoc(collection(db, `orders/${orderId}/messages`), {
                senderId: currentUserId,
                senderName: currentUserName,
                senderRole: currentUserRole,
                text: '',
                imageUrl: downloadUrl,
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
                
                await uploadAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const uploadAudio = async (audioBlob: Blob) => {
        setIsUploading(true);
        try {
            const fileRef = ref(storage, `order_chats/${orderId}/audio_${Date.now()}.webm`);
            const uploadTask = await uploadBytesResumable(fileRef, audioBlob);
            const downloadUrl = await getDownloadURL(uploadTask.ref);

            await addDoc(collection(db, `orders/${orderId}/messages`), {
                senderId: currentUserId,
                senderName: currentUserName,
                senderRole: currentUserRole,
                text: '',
                audioUrl: downloadUrl,
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error uploading audio:', error);
            alert('Failed to send voice message');
        } finally {
            setIsUploading(false);
        }
    };

    const getDisplayName = (msg: ChatMessage) => {
        if (msg.senderId === currentUserId) return 'You';
        if (msg.senderRole === 'admin') return 'Admin (Shop Owner)';
        if (msg.senderRole === 'tailor' && currentUserRole === 'customer') return 'Your Tailor';
        return msg.senderName;
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '500px',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem',
                backgroundColor: 'var(--secondary)',
                borderBottom: '1px solid var(--border)',
                fontWeight: 'bold',
                color: 'var(--foreground)'
            }}>
                Order Discussion
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        const isAdmin = msg.senderRole === 'admin';
                        
                        return (
                            <div key={msg.id} style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start'
                            }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: isAdmin && !isMe ? 'var(--primary)' : 'var(--text-muted)',
                                    marginBottom: '0.2rem',
                                    fontWeight: isAdmin ? 'bold' : 'normal'
                                }}>
                                    {getDisplayName(msg)}
                                </span>
                                
                                <div style={{
                                    backgroundColor: isMe ? 'var(--primary)' : 'var(--secondary)',
                                    color: isMe ? '#000' : 'var(--foreground)',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: isAdmin && !isMe ? '1px solid var(--primary)' : '1px solid transparent',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                    {msg.text && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>}
                                    
                                    {msg.imageUrl && (
                                        <img 
                                            src={msg.imageUrl} 
                                            alt="Sent image" 
                                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', marginTop: msg.text ? '0.5rem' : '0' }}
                                        />
                                    )}
                                    
                                    {msg.audioUrl && (
                                        <audio 
                                            controls 
                                            src={msg.audioUrl} 
                                            style={{ marginTop: msg.text ? '0.5rem' : '0', height: '40px', maxWidth: '250px' }}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: '1rem',
                backgroundColor: 'var(--secondary)',
                borderTop: '1px solid var(--border)'
            }}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    
                    {/* Image Upload */}
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        style={{ display: 'none' }} 
                    />
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isRecording}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.5rem'
                        }}
                        title="Attach Image"
                    >
                        <ImageIcon size={20} />
                    </button>

                    {/* Voice Recording */}
                    {isRecording ? (
                        <button
                            type="button"
                            onClick={stopRecording}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                animation: 'pulse 1.5s infinite'
                            }}
                            title="Stop Recording"
                        >
                            <Square size={20} fill="currentColor" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={startRecording}
                            disabled={isUploading}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.5rem'
                            }}
                            title="Record Voice Message"
                        >
                            <Mic size={20} />
                        </button>
                    )}

                    {/* Text Input */}
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isRecording ? "Recording audio..." : "Type a message..."}
                        disabled={isRecording || isUploading}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--background)',
                            color: 'var(--foreground)'
                        }}
                    />

                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !isUploading) || isRecording}
                        style={{
                            backgroundColor: 'var(--primary)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (!newMessage.trim() && !isUploading) || isRecording ? 'not-allowed' : 'pointer',
                            opacity: (!newMessage.trim() && !isUploading) || isRecording ? 0.5 : 1
                        }}
                    >
                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>
            
            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
