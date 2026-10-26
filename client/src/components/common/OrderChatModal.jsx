import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Loader2, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const OrderChatModal = ({ order, isOpen, onClose }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const isBuyer = order?.buyerId?._id === user?._id || order?.buyerId === user?._id;
  const otherParty = isBuyer ? order?.sellerId : order?.buyerId;
  const otherPartyName = otherParty?.name || (isBuyer ? 'Seller' : 'Buyer');

  const fetchMessages = async () => {
    if (!order?._id) return;
    try {
      setLoading(true);
      const res = await api.get(`/messages/order/${order._id}`);
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.warn('Failed to load order messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && order?._id) {
      fetchMessages();
      // Polling every 5 seconds while chat modal is open
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, order?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      setSending(true);
      const res = await api.post('/messages', {
        orderId: order._id,
        message: inputText.trim(),
      });
      if (res.data?.message) {
        setMessages((prev) => [...prev, res.data.message]);
      }
      setInputText('');
    } catch (err) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[580px]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm">
              {otherPartyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">{otherPartyName}</h3>
              <p className="text-[11px] text-slate-400">
                Order #{order._id.slice(-6).toUpperCase()} • {order.materialId?.name || 'Material'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {/* Order info badge banner */}
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-center text-xs text-amber-900 space-y-0.5">
            <span className="font-bold">Pickup Scheduled: </span>
            <span>
              {order.pickupDate} ({order.pickupStartTime} – {order.pickupEndTime})
            </span>
            <p className="text-[11px] text-amber-700 font-medium">
              Location: {order.pickupAddress}, {order.pickupCity}
            </p>
          </div>

          {loading && messages.length === 0 ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-1">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No messages yet</p>
              <p>Send a message to coordinate pickup and collection.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-amber-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 flex-shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${otherPartyName}...`}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white transition-colors disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderChatModal;
