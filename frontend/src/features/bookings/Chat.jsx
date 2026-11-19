import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useMessagesQuery, useSendMessageMutation, errorText } from '../../api/api';

export default function Chat({ bookingId, as, readOnly }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const { data: messages = [], isLoading } = useMessagesQuery(bookingId, { pollingInterval: 8000, refetchOnFocus: true });
  const [send, { isLoading: sending }] = useSendMessageMutation();
  const box = useRef(null);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [messages.length]);

  const submit = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setErr('');
    try { await send({ id: bookingId, text: t }).unwrap(); setText(''); } catch (x) { setErr(errorText(x)); }
  };

  return (
    <div>
      <div className="chat" ref={box}>
        {isLoading && <p className="muted" style={{ fontSize: 13 }}>Loading messages…</p>}
        {!isLoading && messages.length === 0 && <p className="muted" style={{ fontSize: 13 }}>No messages yet. Say jambo 👋</p>}
        {messages.map((m) => (
          <motion.div key={m.id} className={`bubble ${m.from === as ? 'me' : 'them'}`} initial={{ opacity: 0, y: 10, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
            {m.from !== as && <div style={{ fontSize: 11, opacity: .7, fontWeight: 600 }}>{m.senderName}</div>}
            {m.text}
            <div style={{ fontSize: 10, opacity: .65, marginTop: 2 }}>{new Date(m.at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</div>
          </motion.div>
        ))}
      </div>
      {!readOnly && (
        <form className="row" style={{ marginTop: 10, flexWrap: 'nowrap' }} onSubmit={submit}>
          <input className="input" placeholder="Type a message…" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-primary icon-btn" style={{ flex: 'none', width: 44, height: 44 }} disabled={sending} aria-label="Send"><Send size={16} /></button>
        </form>
      )}
      {err && <p className="error" style={{ marginTop: 8 }}>{err}</p>}
    </div>
  );
}
