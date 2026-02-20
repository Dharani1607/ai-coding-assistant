import React, { useState, useRef, useEffect } from 'react';
import { Send, Code, Copy, Trash2, Loader } from 'lucide-react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hello! I\'m your AI Coding Assistant. I can help you with:\n\n• Debug and fix code errors\n• Explain errors with detailed solutions\n• Generate code from descriptions\n• Support multiple programming languages\n\nJust paste your code or describe what you need!'
    }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Call Groq API
  const callGeminiAPI = async (userMessage) => {
    try {
      const API_KEY = process.env.REACT_APP_GROQ_API_KEY;
      
      if (!API_KEY) {
        return '❌ Error: API key not found. Please check your .env file and restart the app.';
      }

      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are an expert coding assistant specializing in ${language}. 
                - If the user has a code error, identify the error type, explain what's wrong, and provide corrected code
                - If the user wants to generate code, create complete, working, production-ready code
                - Always format code blocks with triple backticks and language name (e.g., \`\`\`javascript)
                - Be clear, concise, and educational
                - Include comments in code to explain key parts`
              },
              {
                role: 'user',
                content: userMessage
              }
            ],
            temperature: 0.7,
            max_tokens: 2048,
          })
        }
      );

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      } else if (data.error) {
        return `❌ API Error: ${data.error.message}`;
      } else {
        return '❌ Sorry, I encountered an error. Please try again.';
      }
    } catch (error) {
      console.error('API Error:', error);
      return '❌ Network error. Please check your internet connection and API key.';
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    const aiResponse = await callGeminiAPI(userMessage);
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: aiResponse
    }]);
    setIsLoading(false);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('✅ Code copied to clipboard!');
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '👋 Chat cleared! How can I help you with coding today?'
    }]);
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <Code className="icon" />
          <h1>AI Coding Assistant</h1>
        </div>
        <div className="header-right">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-select"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="csharp">C#</option>
            <option value="html">HTML/CSS</option>
            <option value="react">React</option>
            <option value="nodejs">Node.js</option>
            <option value="typescript">TypeScript</option>
            <option value="php">PHP</option>
          </select>
          <button onClick={clearChat} className="clear-btn" title="Clear chat">
            <Trash2 className="icon-sm" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content.split('```').map((part, i) => {
                if (i % 2 === 1) {
                  const lines = part.split('\n');
                  const lang = lines[0].trim();
                  const code = lines.slice(1).join('\n');
                  return (
                    <div key={i} className="code-block">
                      <div className="code-header">
                        <span className="code-lang">{lang || 'code'}</span>
                        <button onClick={() => copyCode(code)} className="copy-btn">
                          <Copy className="icon-xs" />
                          Copy
                        </button>
                      </div>
                      <pre><code>{code}</code></pre>
                    </div>
                  );
                }
                return <div key={i} className="text-content">{part}</div>;
              })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content loading">
              <Loader className="spinner" />
              <span>Analyzing your code...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask a coding question, paste code to debug, or describe what you want to build..."
            className="input-box"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="send-btn"
          >
            {isLoading ? <Loader className="spinner" /> : <Send className="icon-sm" />}
          </button>
        </div>
        <p className="input-hint">
          Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for new line
        </p>
      </div>
    </div>
  );
}

export default App;
