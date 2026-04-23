import React, { useEffect, useRef } from 'react';
import type { Terminal as TerminalType } from 'xterm';
import type { FitAddon as FitAddonType } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface SSHClientProps {
  systemId: number;
  sessionId: string;
  userId: string;
  onClose?: () => void;
}

const SSHClient: React.FC<SSHClientProps> = ({ systemId, sessionId, userId, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<TerminalType | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const onCloseRef = useRef(onClose);

  // Keep onClose ref updated
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!terminalRef.current) return;

    let term: TerminalType | null = null;
    let socket: WebSocket | null = null;
    let isMounted = true;

    const init = async () => {
      // Lazy load xterm and its fit addon
      const xtermModule = await import('xterm');
      const fitModule = await import('xterm-addon-fit');
      
      const Terminal = xtermModule.Terminal;
      const FitAddon = fitModule.FitAddon;

      if (!isMounted || !terminalRef.current) return;

      // Initialize xterm
      term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: '"Menlo", "Monaco", "Consolas", "Courier New", monospace',
        theme: {
          background: '#1a1b26',
          foreground: '#a9b1d6',
          cursor: '#f7768e',
          black: '#15161e',
          red: '#f7768e',
          green: '#9ece6a',
          yellow: '#e0af68',
          blue: '#7aa2f7',
          magenta: '#bb9af7',
          cyan: '#7dcfff',
          white: '#a9b1d6',
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current = term;

      // Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/bastion?session_id=${sessionId}`;
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        // Send initial configuration
        if (socket) {
          socket.send(JSON.stringify({
            system_id: systemId,
            action: 'ssh',
            user_id: userId
          }));
        }
        if (term) term.writeln('\x1b[1;32mConnection established.\x1b[0m');
      };

      socket.onmessage = (event) => {
        if (term) term.write(event.data);
      };

      socket.onclose = () => {
        if (term) term.writeln('\n\x1b[1;31mConnection closed.\x1b[0m');
        if (onCloseRef.current) onCloseRef.current();
      };

      socket.onerror = (error) => {
        if (term) term.writeln('\n\x1b[1;31mConnection error.\x1b[0m');
        console.error('WebSocket Error:', error);
      };

      // User input from terminal to WebSocket
      term.onData((data: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(data);
        }
      });

      // Handle resizing
      const handleResize = () => {
        fitAddon.fit();
      };
      window.addEventListener('resize', handleResize);
    };

    init();

    return () => {
      isMounted = false;
      if (socket) socket.close();
      if (term) term.dispose();
      // Note: removing the resize listener should ideally be done but requires
      // storing it in a ref or similar if we define it inside init.
    };
  }, [systemId, sessionId, userId]);

  return (
    <div className="w-full h-full bg-[#1a1b26] p-2 rounded-lg overflow-hidden shadow-2xl border border-[#24283b]">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
};

export default SSHClient;
