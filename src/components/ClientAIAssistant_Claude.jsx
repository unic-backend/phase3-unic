import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase/init';

const ClientAIAssistant_Claude = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis l\'assistant de UniC Plaquiste. Comment puis-je vous aider aujourd\'hui ?' }
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
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      const response = await fetch('/.netlify/functions/ia-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto bg-[#0C1829] rounded-2xl overflow-hidden border border-[#1F2A44]">
      {/* Header */}
      <div className="bg-[#1A3FA0] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">🔧</div>
          <div>
            <div className="font-bold text-white text-xl">Assistant UniC Plaquiste</div>
            <div className="text-white/70 text-sm">Estimation • Devis • Conseils</div>
          </div>
        </div>
        <div className="text-white/60 text-sm">Connecté 24h/24</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0C1829]">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-5 py-4 rounded-2xl text-[15px] leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-[#1A3FA0] text-white rounded-br-none' 
                : 'bg-[#1F2A44] text-white rounded-bl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1F2A44] px-5 py-4 rounded-2xl rounded-bl-none flex gap-2">
              <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#111F35] border-t border-[#1F2A44]">
        <div className="flex gap-3 max-w-5xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez votre question (surface, type de travaux, etc.)..."
            className="flex-1 bg-[#1F2A44] text-white px-6 py-4 rounded-2xl text-[15px] placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#F6C344]"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-[#F6C344] hover:bg-[#E5B93A] disabled:bg-gray-600 text-[#060D18] font-semibold px-8 rounded-2xl transition-all active:scale-[0.985]"
          >
            Envoyer
          </button>
        </div>
        <p className="text-center text-xs text-white/40 mt-3">
          L’estimation est indicative. Le devis final sera envoyé par Ousmane.
        </p>
      </div>
    </div>
  );
};

export default ClientAIAssistant_Claude;