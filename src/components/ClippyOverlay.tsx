import * as React from 'react';
import { useClippyHotkey } from '@/hooks/useClippyHotkey';
import { Paperclip, Send, Smile } from 'lucide-react';

const CLIPPY_SVG = (
  <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-lg">
    <defs>
      <linearGradient id="clippyBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4A90D9" />
        <stop offset="100%" stopColor="#2E5C8A" />
      </linearGradient>
      <linearGradient id="clippyHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6BA3E0" />
        <stop offset="100%" stopColor="#4A90D9" />
      </linearGradient>
    </defs>

    <g className="clippy-body animate-bounce-subtle" style={{ transformOrigin: '50% 90%' }}>
      <path
        d="M20 80 Q20 30 50 25 Q80 20 85 50 Q90 70 70 75 L70 85 Q40 90 20 80"
        fill="url(#clippyBody)"
        stroke="#1E3A5F"
        strokeWidth="2"
      />

      <path
        d="M30 75 Q30 45 50 40 Q65 38 70 55"
        fill="none"
        stroke="url(#clippyHighlight)"
        strokeWidth="4"
        strokeLinecap="round"
        className="clippy-highlight"
      />

      <circle cx="40" cy="50" r="4" fill="#1E3A5F" />
      <circle cx="60" cy="50" r="4" fill="#1E3A5F" />

      <ellipse cx="50" cy="62" rx="8" ry="5" fill="#1E3A5F" opacity="0.3" />

      <path
        d="M20 40 Q5 35 10 20 Q15 10 30 15"
        fill="none"
        stroke="url(#clippyBody)"
        strokeWidth="6"
        strokeLinecap="round"
        className="clippy-arm-left animate-wave"
        style={{ transformOrigin: '20% 40%' }}
      />

      <path
        d="M80 40 Q95 35 90 20 Q85 10 70 15"
        fill="none"
        stroke="url(#clippyBody)"
        strokeWidth="6"
        strokeLinecap="round"
        className="clippy-arm-right animate-wave"
        style={{ transformOrigin: '80% 40%', animationDelay: '0.5s' }}
      />
    </g>
  </svg>
);

function SpeechBubble({ message, show }: { message: string; show: boolean }) {
  const [displayedText, setDisplayedText] = React.useState('');

  React.useEffect(() => {
    if (!show) {
      setDisplayedText('');
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i < message.length) {
        setDisplayedText(message.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [show, message]);

  if (!show) return null;

  return (
    <div
      className={`
        absolute whitespace-normal min-w-[200px] max-w-[420px] p-3 
        bg-white rounded-2xl shadow-xl border border-gray-200
        left-full ml-4
        ${show ? 'animate-in fade-in zoom-in-95 duration-300' : 'animate-out fade-out zoom-out-95'}
      `}
      style={{ top: '-10px' }}
    >
      <p className="text-sm text-gray-800 leading-relaxed">
        {displayedText}
        <span className="animate-pulse">|</span>
      </p>

      <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 -rotate-45 w-4 h-4 bg-white border-l border-b border-gray-200" />
    </div>
  );
}

function Clippy({ position, isVisible, message, showBubble }: {
  position: { x: number; y: number };
  isVisible: boolean;
  message: string;
  showBubble: boolean;
}) {
  const [flipBubble, setFlipBubble] = React.useState(false);

  React.useEffect(() => {
    const bubbleWidth = 240;
    const clippyWidth = 64;
    const x = position.x - 32;

    if (x + clippyWidth + bubbleWidth > window.innerWidth - 20) {
      setFlipBubble(true);
    } else {
      setFlipBubble(false);
    }
  }, [position.x]);

  const x = position.x - 32;
  const y = position.y - 80;

  return (
    <div
      className={`
        fixed z-[100] pointer-events-none
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{
        left: x,
        top: y,
        transition: 'left 0.05s linear, top 0.05s linear',
      }}
    >
      <div className="relative">
        <SpeechBubble message={message} show={showBubble} />
        <div className={`
          ${isVisible ? 'animate-in fade-in zoom-in-95 duration-300' : ''}
        `}>
          {CLIPPY_SVG}
        </div>
      </div>
    </div>
  );
}

function FixedInputBar({
  isVisible,
  onSend,
  isLoading = false
}: {
  isVisible: boolean;
  onSend: (message: string) => void;
  isLoading?: boolean;
}) {
  const [value, setValue] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isVisible && textareaRef.current && !isLoading) {
      textareaRef.current.focus();
    }
  }, [isVisible, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };

  const handleSend = () => {
    if (value.trim() && !isLoading) {
      onSend(value);
      setValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[101] flex items-end gap-2 bg-white border-t border-gray-200 p-3 shadow-lg">
      <button
        className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        onClick={() => { }}
        disabled={isLoading}
      >
        <Paperclip className="w-5 h-5" />
      </button>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={isLoading ? "Thinking..." : "Ask Clippy..."}
        rows={4}
        disabled={isLoading}
        className="
          flex-1 resize-none rounded-lg border border-gray-300 
          px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400
          bg-gray-50 disabled:opacity-50
        "
        style={{ minHeight: '40px', maxHeight: '150px' }}
      />

      <button
        onClick={handleSend}
        disabled={!value.trim() || isLoading}
        className="
          flex-shrink-0 p-2 rounded-lg transition-colors
          bg-blue-500 text-white hover:bg-blue-600 
          disabled:bg-gray-300 disabled:cursor-not-allowed
        "
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}

export function ClippyOverlay() {
  const { isVisible, mousePos, hide } = useClippyHotkey();
  const [message, setMessage] = React.useState("I'll help you with that!");
  const [showBubble, setShowBubble] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSend = async (text: string) => {
    console.log('User message:', text);
    setMessage("Thinking...");
    setShowBubble(true);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          stream: false
        })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        if (data.session_id) {
          setSessionId(data.session_id);
        }
        
        const reply = data.response || "I've processed your request.";
          
        setMessage(reply);
      } else {
        setMessage(`Error: ${data.message || "Something went wrong"}`);
      }
    } catch (error) {
      console.error("Agent API error:", error);
      setMessage("Error connecting to the agent.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[99]"
        onClick={hide}
      />
      <Clippy
        position={mousePos}
        isVisible={isVisible}
        message={message}
        showBubble={showBubble}
      />
      <FixedInputBar isVisible={isVisible} onSend={handleSend} isLoading={isLoading} />
    </>
  );
}
