import { useState, useEffect } from 'react';
import api from '../services/api'; // Sử dụng instance api chuẩn của bạn

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

export default function NotificationList() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            // Gọi API thông qua instance api đã cấu hình sẵn Interceptors
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Lỗi khi tải thông báo:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((item) => (item.id === id ? { ...item, read: true } : item))
            );
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái thông báo:', error);
        }
    };

    const unreadCount = notifications.filter((item) => !item.read).length;

    if (loading) {
        return <div className="p-4 text-center text-gray-500">Đang tải thông báo...</div>;
    }

    return (
        <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 my-6">
            <div className="bg-blue-600 px-4 py-3 text-white flex justify-between items-center">
                <h3 className="font-semibold text-lg">Thông báo của bạn</h3>
                {unreadCount > 0 && (
                    <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full font-medium">
            {unreadCount} chưa đọc
          </span>
                )}
            </div>

            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="p-6 text-center text-gray-400">Không có thông báo nào.</p>
                ) : (
                    notifications.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => !item.read && handleMarkAsRead(item.id)}
                            className={`p-4 transition cursor-pointer hover:bg-gray-50 ${
                                item.read ? 'bg-white opacity-75' : 'bg-blue-50/50'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-sm text-gray-900">{item.title}</span>
                                <span className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{item.message}</p>

                            <div className="flex justify-between items-center text-xs">
                <span className="inline-block bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">
                  {item.type}
                </span>
                                {!item.read && (
                                    <span className="text-blue-600 font-medium hover:underline">
                    Đánh dấu đã đọc
                  </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}