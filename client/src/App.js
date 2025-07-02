import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Initialize socket but don't auto-connect
const socket = io('http://localhost:5050', { autoConnect: false });

function App() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.connect();

    const handlePartnerFound = () => {
      setConnected(true);
      setMessages([{ from: 'system', text: '🟢 You are now connected to a stranger.' }]);
    };

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, { from: 'stranger', text: msg }]);
    };

    const handlePartnerDisconnected = () => {
  setConnected(true); // 👈 keep connected = true to show "Next" button
  setMessages((prev) => [...prev, { from: 'system', text: '🔌 Stranger disconnected. Click "Next" to find someone else.' }]);
};

    socket.on('partner-found', handlePartnerFound);
    socket.on('message', handleMessage);
    socket.on('partner-disconnected', handlePartnerDisconnected);

    return () => {
      socket.off('partner-found', handlePartnerFound);
      socket.off('message', handleMessage);
      socket.off('partner-disconnected', handlePartnerDisconnected);
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('message', input);
      setMessages((prev) => [...prev, { from: 'you', text: input }]);
      setInput('');
    }
  };

  const nextChat = () => {
    setMessages([{ from: 'system', text: '🔄 Searching for a new partner...' }]);
    setConnected(false);
    socket.emit('next');
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>🟢 Omegle Clone - Text Chat</h1>

      <div style={{
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: 12,
        height: 300,
        overflowY: 'scroll',
        backgroundColor: '#f9f9f9',
        marginBottom: 12
      }}>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.from}:</strong> {msg.text}
          </div>
        ))}
      </div>

      {connected ? (
        <>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            style={{ width: '70%', padding: 10 }}
          />
          <button onClick={sendMessage} style={{ padding: 10, marginLeft: 10 }}>
            Send
          </button>
          <button onClick={nextChat} style={{ padding: 10, marginLeft: 10, backgroundColor: '#eee' }}>
            🔁 Next
          </button>
        </>
      ) : (
        <p>🔍 Searching for a partner...</p>
      )}
    </div>
  );
}

export default App;