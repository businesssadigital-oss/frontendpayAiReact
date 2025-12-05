import React, { useEffect } from 'react';
import { X, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { Notification } from '../types';

interface ToastProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none">
      {notifications.map((notif) => (
        <ToastItem key={notif.id} notification={notif} onClose={() => removeNotification(notif.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto close after 4 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-emerald-600',
    info: 'bg-indigo-600',
    error: 'bg-red-600',
  };

  const icons = {
    success: CheckCircle,
    info: Info,
    error: AlertCircle,
  };

  const Icon = icons[notification.type];

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg shadow-gray-200 text-white min-w-[300px] animate-fade-in-up transition-all ${bgColors[notification.type]}`}>
      <Icon size={20} />
      <span className="flex-1 text-sm font-medium">{notification.message}</span>
      <button onClick={onClose} className="opacity-80 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </div>
  );
};
