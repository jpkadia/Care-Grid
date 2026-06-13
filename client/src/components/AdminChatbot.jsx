import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const AdminChatbot = ({ endpoint, historyEndpoint, token, title = 'Admin Data Assistant' }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Ask me about the doctors, profile details, or appointments available in this admin panel.' }
  ]);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (!open || !historyEndpoint || !token) return;
    const loadHistory = async () => {
      try {
        const res = await axios.get(historyEndpoint, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.data?.length) setMessages(res.data.data);
      } catch {
        // Keep the welcome message when history cannot be loaded.
      }
    };
    loadHistory();
  }, [historyEndpoint, open, token]);

  useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  const submit = async (e) => {
    e.preventDefault();
    const question = message.trim();
    if (!question || loading) return;

    const nextMessages = [...messages, { role: 'user', content: question }];
    setMessages(nextMessages);
    setMessage('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(({ role, content }) => ({ role, content }));
      const res = await axios.post(endpoint, { message: question, history }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(current => [...current, { role: 'assistant', content: res.data.answer }]);
    } catch (err) {
      setMessages(current => [...current, {
        role: 'assistant',
        content: err.response?.data?.message || 'I could not answer that right now.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(value => !value)} className="fixed bottom-6 right-6 z-40 bg-gradient-to-br from-teal-500 to-emerald-700 hover:-translate-y-1 text-white rounded-2xl w-16 h-16 shadow-2xl shadow-teal-900/20 flex items-center justify-center text-2xl transition-transform" title={title}>
        <i className={open ? 'fas fa-times' : 'fas fa-comment-dots'}></i>
      </button>
      {open && (
        <aside className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100%-2rem)] sm:w-[420px] h-[600px] max-h-[75vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-rise">
          <div className="bg-gradient-to-br from-slate-950 to-teal-950 text-white px-5 py-5">
            <div className="font-bold"><i className="fas fa-robot text-blue-400 mr-2"></i>{title}</div>
            <div className="text-xs text-slate-300 mt-1">Answers are restricted to this panel's database data.</div>
          </div>
          <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((item, index) => (
              <div key={index} className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${item.role === 'user' ? 'ml-auto bg-teal-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'}`}>
                {item.content}
              </div>
            ))}
            {loading && <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-sm px-4 py-3 text-sm inline-block">Checking admin data...</div>}
          </div>
          <form onSubmit={submit} className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask about panel data..." className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <button disabled={loading || !message.trim()} className="bg-teal-600 disabled:bg-slate-300 text-white rounded-xl px-4" type="submit"><i className="fas fa-paper-plane"></i></button>
          </form>
        </aside>
      )}
    </>
  );
};

export default AdminChatbot;
