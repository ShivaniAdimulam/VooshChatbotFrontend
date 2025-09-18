import React, { useEffect, useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { FaSyncAlt } from "react-icons/fa";

const API_BASE = "http://localhost:3000/api";

function ChatBubble({ role, text }) {
  return <div className={`bubble ${role}`}>{text}</div>;
}

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // initialize sessionId in localStorage
    let sid = localStorage.getItem("voosh_session");
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem("voosh_session", sid);
    }
    setSessionId(sid);
    // fetch history
    fetchHistory(sid);
  }, []);

  async function fetchHistory(sid) {
    try {
      const r = await axios.get(`${API_BASE}/session/${sid}/history`);
      const hist = r.data.history || [];
      setMessages(hist);
    } catch (err) {
      console.warn("no history or backend down", err.message);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const message = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: message }]);
    setLoading(true);
    try {
      const r = await axios.post(`${API_BASE}/chat`, { sessionId, message });
      const answer = r.data.answer;
      setMessages(prev => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      console.error("chat error", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Error: could not get response" }]);
    } finally {
      setLoading(false);
    }
  }

  async function resetSession() {
    try {
      await axios.delete(`${API_BASE}/session/${sessionId}/reset`);
      localStorage.removeItem("voosh_session");
      const newSid = uuidv4();
      localStorage.setItem("voosh_session", newSid);
      setSessionId(newSid);
      setMessages([]);
    } catch (err) {
      console.error("reset failed", err);
    }
  }

  return (
    <div className="app">
      <header className="header"><h2>Voosh News Chat (RAG)</h2></header>
      <div className="chat">
        <div className="messages">
          {messages.map((m, i) => <ChatBubble key={i} role={m.role} text={m.content} />)}
          {loading && <ChatBubble role="assistant" text={"..."} />}
        </div>
        <div className="composer">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Ask about the news..."
          />
          <div className="buttons">
            <button onClick={sendMessage} disabled={loading || !input.trim()}>Send</button>
            <button className="reset" onClick={resetSession} title="Reset session"><FaSyncAlt/></button>
          </div>
        </div>
      </div>
      <footer className="footer">session: {sessionId}</footer>
    </div>
  );
}
