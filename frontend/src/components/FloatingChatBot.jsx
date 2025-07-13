import React, { useState, useRef, useEffect } from 'react';

export default function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const userMsg = { sender: 'user', text: userInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:8000/User/chatbot/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      });

      const data = await res.json();
      
      // Simulate typing delay
      setTimeout(() => {
        const botReply = data.reply || data.error || 'שגיאה כללית';
        const botMsg = { sender: 'bot', text: botReply, timestamp: new Date() };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
        setLoading(false);
      }, 800);
    } catch (err) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: '❌ שגיאה בחיבור לשרת', 
          timestamp: new Date() 
        }]);
        setIsTyping(false);
        setLoading(false);
      }, 800);
    }

    setUserInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 left-6 w-96 h-[32rem] bg-white rounded-3xl shadow-2xl transform transition-all duration-500 ease-out z-50 ${
          isOpen 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
        }`}
        dir="rtl"
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-t-3xl p-6 text-white overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/20 rounded-full translate-x-12 translate-y-12 animate-bounce"></div>
          
          {/* Header content */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <div className="text-2xl animate-bounce">🤖</div>
              </div>
              <div>
                <h3 className="text-xl font-bold">צ'אט AI מתקדם</h3>
                <p className="text-sm text-white/80">אני כאן לעזור לך!</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex flex-col h-80 p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg font-medium">בואו נתחיל לשוחח!</p>
                <p className="text-sm">שאל אותי כל שאלה ואני אעזור לך</p>
              </div>
            )}
            
                         {messages.map((msg, idx) => (
               <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                 <div className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm relative group ${
                   msg.sender === 'user' 
                     ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-tr-md message-user' 
                     : 'bg-gray-100 text-gray-800 rounded-tl-md message-bot'
                 }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <span className={`text-xs opacity-70 mt-1 block ${
                    msg.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </span>
                  
                  {/* Message tail */}
                  <div className={`absolute top-3 w-3 h-3 transform rotate-45 ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 -right-1' 
                      : 'bg-gray-100 -left-1'
                  }`}></div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-end">
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-tl-md max-w-xs shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="relative mt-4">
            <div className="flex items-center bg-gray-50 rounded-2xl border-2 border-transparent focus-within:border-purple-300 transition-colors">
              <textarea
                ref={chatInputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 p-4 bg-transparent resize-none outline-none text-sm max-h-24 scrollbar-thin scrollbar-thumb-gray-300"
                placeholder="כתוב הודעה..."
                rows="1"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !userInput.trim()}
                className="m-2 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-xl hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center group"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative w-16 h-16 bg-gradient-to-br from-purple-500 via-blue-600 to-cyan-500 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transform transition-all duration-300 animate-float hover:animate-glow ${
            isOpen ? 'rotate-45 scale-90' : 'hover:scale-110 hover:-rotate-3'
          }`}
        >
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-500 opacity-20 scale-150 animate-ping"></div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-500 opacity-40 scale-125 animate-pulse"></div>
          
          {/* Button content */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className={`transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}>
              {isOpen ? (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <div className="text-3xl animate-bounce">💬</div>
              )}
            </div>
          </div>

          {/* Notification badge */}
          {!isOpen && messages.length > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
              {messages.filter(m => m.sender === 'bot').length}
            </div>
          )}
        </button>

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            צ'אט AI חכם
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-black/80"></div>
          </div>
        )}
      </div>
    </>
  );
} 