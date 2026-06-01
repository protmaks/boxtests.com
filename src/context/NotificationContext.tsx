import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface ConfirmDialog {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, title: string, message?: string, duration?: number) => void;
  showConfirm: (options: Omit<ConfirmDialog, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirms, setConfirms] = useState<ConfirmDialog[]>([]);

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    duration: number = 4000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const notification: Notification = { id, type, title, message, duration };
    
    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
  }, []);

  const showConfirm = useCallback((options: Omit<ConfirmDialog, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const confirm: ConfirmDialog = {
      id,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'info',
      ...options,
    };
    setConfirms(prev => [...prev, confirm]);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleConfirm = (confirm: ConfirmDialog) => {
    confirm.onConfirm();
    setConfirms(prev => prev.filter(c => c.id !== confirm.id));
  };

  const handleCancel = (confirm: ConfirmDialog) => {
    confirm.onCancel?.();
    setConfirms(prev => prev.filter(c => c.id !== confirm.id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, showConfirm }}>
      {children}
      
      {/* Toast Notifications */}
      {createPortal(
        <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-3 max-w-md pointer-events-none">
          {notifications.map((notification) => (
            <ToastNotification
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>,
        document.body
      )}

      {/* Confirm Dialogs */}
      {confirms.map((confirm) => (
        createPortal(
          <ConfirmModal
            key={confirm.id}
            confirm={confirm}
            onConfirm={() => handleConfirm(confirm)}
            onCancel={() => handleCancel(confirm)}
          />,
          document.body
        )
      ))}
    </NotificationContext.Provider>
  );
}

function ToastNotification({ 
  notification, 
  onClose 
}: { 
  notification: Notification;
  onClose: () => void;
}) {
  const icons = {
    success: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const colors = {
    success: {
      bg: 'from-emerald-500/90 to-green-600/90',
      border: 'border-emerald-400/50',
      shadow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
      icon: 'text-emerald-100',
      text: 'text-white',
    },
    error: {
      bg: 'from-rose-500/90 to-red-600/90',
      border: 'border-rose-400/50',
      shadow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
      icon: 'text-rose-100',
      text: 'text-white',
    },
    warning: {
      bg: 'from-amber-500/90 to-orange-600/90',
      border: 'border-amber-400/50',
      shadow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
      icon: 'text-amber-100',
      text: 'text-white',
    },
    info: {
      bg: 'from-cyan-500/90 to-blue-600/90',
      border: 'border-cyan-400/50',
      shadow: 'shadow-[0_0_30px_rgba(14,165,233,0.3)]',
      icon: 'text-cyan-100',
      text: 'text-white',
    },
  };

  const style = colors[notification.type];

  return (
    <div
      className={`
        pointer-events-auto
        animate-slide-in-right
        bg-gradient-to-br ${style.bg}
        border ${style.border}
        ${style.shadow}
        backdrop-blur-xl
        rounded-xl
        p-4
        min-w-[320px]
        max-w-md
        flex items-start gap-3
        relative
        overflow-hidden
        group
        hover:scale-[1.02]
        transition-transform
      `}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {/* Icon */}
      <div className={`${style.icon} flex-shrink-0 relative z-10`}>
        {icons[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 relative z-10">
        <h4 className={`font-semibold ${style.text} text-sm mb-1`}>
          {notification.title}
        </h4>
        {notification.message && (
          <p className={`${style.text} opacity-90 text-xs leading-relaxed whitespace-pre-line`}>
            {notification.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className={`${style.icon} flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity relative z-10 p-1 hover:bg-white/10 rounded`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      {notification.duration && notification.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
          <div 
            className="h-full bg-white/60 animate-progress-bar origin-left"
            style={{ animationDuration: `${notification.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}

function ConfirmModal({
  confirm,
  onConfirm,
  onCancel,
}: {
  confirm: ConfirmDialog;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const typeStyles = {
    danger: {
      icon: (
        <svg className="w-12 h-12 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      confirmButton: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)]',
      iconGlow: 'shadow-[0_0_40px_rgba(244,63,94,0.3)]',
    },
    warning: {
      icon: (
        <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      confirmButton: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]',
      iconGlow: 'shadow-[0_0_40px_rgba(251,191,36,0.3)]',
    },
    info: {
      icon: (
        <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      confirmButton: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]',
      iconGlow: 'shadow-[0_0_40px_rgba(14,165,233,0.3)]',
    },
  };

  const style = typeStyles[confirm.type || 'info'];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 pointer-events-none" />
        
        {/* Content */}
        <div className="relative p-8 flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`mb-6 ${style.iconGlow} rounded-full p-3 bg-slate-800/50`}>
            {style.icon}
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-4">
            {confirm.title}
          </h3>

          {/* Message */}
          <p className="text-slate-300 text-sm leading-relaxed mb-8 whitespace-pre-line max-h-[300px] overflow-y-auto">
            {confirm.message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-all rounded-xl font-medium hover:bg-slate-750"
            >
              {confirm.cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all ${style.confirmButton}`}
            >
              {confirm.confirmText}
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      </div>
    </div>
  );
}
