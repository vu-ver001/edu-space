import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

interface NotificationItem {
    id: number;
    recipientId: number;
    type: string;
    title: string;
    message: string;
    relatedBookingId: number | null;
    createdAt: string;
    read: boolean;
}

export default function NotificationBubble() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const response = await api.get<NotificationItem[]>('/api/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Lỗi khi tải thông báo:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((item) => (item.id === id ? { ...item, read: true } : item))
            );
        } catch (error) {
            console.error('Lỗi khi đánh dấu đã đọc:', error);
        }
    };

    const unreadCount = notifications.filter((item) => !item.read).length;

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 999999 }} ref={dropdownRef}>
            {/* Khung Popup danh sách thông báo nổi */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: '70px',
                    right: '0',
                    width: '350px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb'
                }}>
                    {/* Header của Popup */}
                    <div style={{ backgroundColor: '#2563eb', padding: '12px 16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Thông báo hệ thống</h3>
                        {unreadCount > 0 && (
                            <span style={{ backgroundColor: '#ef4444', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                {unreadCount} chưa đọc
                            </span>
                        )}
                    </div>

                    {/* Danh sách thông báo */}
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <p style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', margin: 0 }}>Không có thông báo nào.</p>
                        ) : (
                            /* Thêm .slice(0, 7) để giới hạn chỉ hiển thị 7 thông báo mới nhất */
                            notifications.slice(0, 7).map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => !item.read && handleMarkAsRead(item.id)}
                                    style={{
                                        padding: '14px',
                                        borderBottom: '1px solid #f3f4f6',
                                        cursor: 'pointer',
                                        backgroundColor: item.read ? '#ffffff' : '#eff6ff',
                                        opacity: item.read ? 0.75 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{item.title}</span>
                                        <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '55px', textAlign: 'right' }}>
                                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 8px 0' }}>{item.message}</p>

                                    {/* Đã xóa item.type và đổi justifyContent thành flex-end để dồn chữ sang phải */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: '12px', minHeight: '18px' }}>
                                        {!item.read && (
                                            <span style={{ color: '#2563eb', fontWeight: 600 }}>Đánh dấu đã đọc</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Nút Bong bóng nổi (Nút Hình Chuông) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer'
                }}
                aria-label="Mở thông báo"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Chấm đỏ báo số lượng */}
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
}