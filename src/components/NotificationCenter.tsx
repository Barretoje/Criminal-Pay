/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, AlertTriangle, Clock, ShieldCheck, UserPlus } from 'lucide-react';
import { AppNotification } from '../types';
import { formatDate } from '../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}

export default function NotificationCenter({
  notifications,
  markNotificationAsRead,
  clearAllNotifications
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'due_today':
        return (
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'overdue':
        return (
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'new_contract':
        return (
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <UserPlus className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
            <ShieldCheck className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={containerRef} id="notification-center">
      {/* Alert Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-100 transition-colors bg-slate-800/80 rounded-xl hover:bg-slate-800 border border-slate-700/50"
        aria-label="Notificações"
        id="notification-bell-btn"
      >
        <Bell className="w-5 h-5 text-amber-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 mr-[-2px]"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm">Alertas e Notificações</h3>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                    title="Marcar tudo como lido"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Limpar
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm">Nenhuma notificação ativa no sistema.</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 flex gap-3 transition-colors hover:bg-slate-50 ${
                      !notif.read ? 'bg-slate-50/60 font-medium' : ''
                    }`}
                  >
                    {getIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <span className={`text-xs font-semibold ${
                          notif.type === 'overdue' ? 'text-rose-600' : 
                          notif.type === 'due_today' ? 'text-amber-600' : 'text-slate-800'
                        }`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal shrink-0">
                          {formatDate(notif.date)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 pr-2 leading-relaxed">
                        {notif.message}
                      </p>
                      {!notif.read && (
                        <button
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="mt-2 text-[11px] font-semibold text-slate-600 hover:text-amber-600 flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Arquivar alerta
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">
                Atendimento Criminal Pay ativo
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
