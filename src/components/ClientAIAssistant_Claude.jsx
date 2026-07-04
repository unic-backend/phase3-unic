import React, { useState, useRef, useEffect } from 'react';

const ClientAIAssistant_Claude = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis l\'assistant de UniC Plaquiste. Quel type de travaux souhaitez-vous ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/.netlify/functions/ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          historique: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();

      if (data.reponse) {
        setMessages([...newMessages, { role: 'assistant', content: data.reponse }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'Désolé, une erreur est survenue. Contactez Ousmane sur WhatsApp.' }]);
      }
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: 'Désolé, une erreur est survenue. Contactez Ousmane sur WhatsApp.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 9999,
          backgroundColor: '#1A3FA0',
          color: 'white',
          padding: '14px 24px',
          borderRadius: '50px',
          border: 'none',
          fontSize: '16px',
          boxShadow: '0 10px 25px rgba(26,63,160,0.4)',
          cursor: 'pointer'
        }}
      >
        💬 Assistant UniC
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          width: '380px',
          height: '520px',
          background: '#1F2937',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          zIndex: 10000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{padding: '16px', background: '#1A3FA0', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>UniC Assistant</div>
            <button onClick={() => setIsOpen(false)} style={{color: 'white', fontSize: '24px'}}>×</button>
          </div>

          <div style={{flex: 1, padding: '16px', overflowY: 'auto', background: '#111827'}}>
            {messages.map((msg, i) => (
              <div key={i} style={{marginBottom: '16px', textAlign: msg.role === 'user' ? 'right' : 'left'}}>
                <div style={{
                  display: 'inline-block',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: msg.role === 'user' ? '#1A3FA0' : '#374151',
                  color: 'white',
                  maxWidth: '80%'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && <div>UniC IA réfléchit...</div>}
          </div>

          <div style={{padding: '12px', borderTop: '1px solid #374151'}}>
            <div style={{display: 'flex', gap: '8px'}}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                style={{flex: 1, padding: '12px', borderRadius: '9999px', border: 'none', background: '#374151', color: 'white'}}
              />
              <button onClick={sendMessage} style={{padding: '12px 24px', background: '#1A3FA0', color: 'white', borderRadius: '9999px'}}>Envoyer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientAIAssistant_Claude;