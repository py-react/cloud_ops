import React, { useEffect, useRef, useState } from 'react';
import type { Terminal as TerminalType } from 'xterm';
import type { FitAddon as FitAddonType } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import Guacamole from 'guacamole-common-js';
import { Monitor, Terminal, Copy, Loader2 } from 'lucide-react';
import type { ConnectionType } from './TerminalContext';

interface SSHClientProps {
  systemId: number;
  sessionId: string;
  userId: string;
  connectionType: ConnectionType;
  onClose?: () => void;
}

const SSHClient: React.FC<SSHClientProps> = ({ systemId, sessionId, userId, connectionType, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<TerminalType | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const onCloseRef = useRef(onClose);
  const rdpDisplayRef = useRef<HTMLDivElement>(null);
  const guacClientRef = useRef<any>(null);
  const guacTunnelRef = useRef<any>(null);
  const [rdpStatus, setRdpStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [rdpError, setRdpError] = useState<string>('');
  const [rdpPassword, setRdpPassword] = useState<string>('');

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (connectionType === 'ssh') {
      initSsh();
    } else {
      initRdp();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (guacClientRef.current) {
        guacClientRef.current.disconnect();
        guacClientRef.current = null;
      }
      if (guacTunnelRef.current) {
        guacTunnelRef.current.disconnect();
        guacTunnelRef.current = null;
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, [systemId, sessionId, userId, connectionType]);

  const initSsh = async () => {
    if (!terminalRef.current) return;

    const xtermModule = await import('xterm');
    const fitModule = await import('xterm-addon-fit');

    const Terminal = xtermModule.Terminal;
    const FitAddon = fitModule.FitAddon;

    const term = new Terminal({
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

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/bastion?session_id=${sessionId}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      if (socket) {
        socket.send(JSON.stringify({
          system_id: systemId,
          action: 'ssh',
          user_id: userId
        }));
      }
      if (term) term.writeln('\x1b[1;32mSSH Connection established.\x1b[0m');
    };

    socket.onmessage = (event) => {
      if (term) term.write(event.data);
    };

    socket.onclose = (event) => {
      const reason = event.reason
        ? ` (${event.reason})`
        : event.code !== 1000
          ? ` (code: ${event.code})`
          : '';
      if (term) term.writeln(`\n\x1b[1;31mConnection closed${reason}.\x1b[0m`);
      if (onCloseRef.current) onCloseRef.current();
    };

    socket.onerror = (event) => {
      if (term) term.writeln('\n\x1b[1;31mWebSocket connection error.\x1b[0m');
    };

    term.onData((data: string) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);
  };

  const initRdp = () => {
    if (!rdpDisplayRef.current) return;

    setRdpStatus('connecting');

    // Build WebSocket URL using SSH-style pattern: raw WebSocket, no Guacamole subprotocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/bastion?session_id=${sessionId}`;

    // Create a custom tunnel that follows the SSH pattern:
    // 1. Raw WebSocket (no "guacamole" subprotocol)
    // 2. Send JSON payload as a WebSocket message after connection
    // 3. Then transparently forward Guacamole protocol instructions
    const tunnel = createRdpTunnel(wsUrl);

    // Catch tunnel-level errors (WebSocket connection failures)
    tunnel.onerror = (status: any) => {
      const msg = status?.message || 'Tunnel connection failed';
      console.error('RDP tunnel error:', msg);
      setRdpError(msg);
      setRdpStatus('error');
    };

    guacTunnelRef.current = tunnel;

    const client = new Guacamole.Client(tunnel);
    guacClientRef.current = client;

    const display = client.getDisplay();

    client.onstatechange = (state: number) => {
      if (state === Guacamole.Client.State.CONNECTED) {
        setRdpStatus('connected');
        setRdpError('');
      }
      if (state === Guacamole.Client.State.DISCONNECTED) {
        setRdpStatus('error');
      }
    };

    client.onerror = (error: any) => {
      const msg = error?.message || String(error);
      console.error('Guacamole error:', msg);
      setRdpError(msg);
      setRdpStatus('error');
    };

    // Build JSON payload (same as SSH, but with action: 'rdp')
    const container = rdpDisplayRef.current;
    const screenWidth = container ? container.clientWidth : 1024;
    const screenHeight = container ? container.clientHeight : 768;

    const connectionData = JSON.stringify({
      system_id: systemId,
      action: 'rdp',
      user_id: userId,
      session_id: sessionId,
      width: screenWidth,
      height: screenHeight
    });

    client.connect(connectionData);

    if (rdpDisplayRef.current) {
      rdpDisplayRef.current.innerHTML = '';
      rdpDisplayRef.current.appendChild(display.getElement());
    }

    const mouse = new Guacamole.Mouse(display.getElement());
    mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (mouseState: any) => {
      client.sendMouseState(mouseState);
    };

    new Guacamole.Mouse.Touchpad(display.getElement(), (mouseState: any) => {
      client.sendMouseState(mouseState);
    });

    const keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (keysym: number) => {
      client.sendKeyEvent(1, keysym);
    };
    keyboard.onkeyup = (keysym: number) => {
      client.sendKeyEvent(0, keysym);
    };
  };

  function createRdpTunnel(url: string) {
    let socket: WebSocket | null = null;
    let tunnelState = Guacamole.Tunnel.State.CLOSED;
    let tunnelUuid: string | null = null;
    let onerror: ((status: any) => void) | null = null;
    let onstatechange: ((state: number) => void) | null = null;
    let oninstruction: ((opcode: string, args: string[]) => void) | null = null;
    let onuuid: ((uuid: string) => void) | null = null;

    const setState = (state: number) => {
      if (state !== tunnelState) {
        tunnelState = state;
        if (onstatechange) onstatechange(state);
      }
    };

    const closeTunnel = (status: any) => {
      if (tunnelState === Guacamole.Tunnel.State.CLOSED) return;

      if (status.code !== Guacamole.Status.Code.SUCCESS && onerror) {
        onerror(status);
      }

      setState(Guacamole.Tunnel.State.CLOSED);

      if (socket && socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
        socket.close();
      }
    };

    const handleMessage = (message: string) => {
      let startIndex = 0;
      const elements: string[] = [];

      while (startIndex < message.length) {
        const lengthEnd = message.indexOf('.', startIndex);
        if (lengthEnd === -1) {
          closeTunnel(new Guacamole.Status(Guacamole.Status.Code.SERVER_ERROR, "Incomplete instruction."));
          return;
        }

        const length = parseInt(message.substring(startIndex, lengthEnd));
        startIndex = lengthEnd + 1;
        const elementEnd = startIndex + length;

        if (elementEnd > message.length) {
          closeTunnel(new Guacamole.Status(Guacamole.Status.Code.SERVER_ERROR, "Incomplete instruction."));
          return;
        }

        const element = message.substring(startIndex, elementEnd);
        const terminator = message.charAt(elementEnd);

        elements.push(element);

        if (terminator === ';') {
          const opcode = elements.shift()!;

          if (tunnelUuid === null) {
            if (opcode === Guacamole.Tunnel.INTERNAL_DATA_OPCODE && elements.length === 1) {
              tunnelUuid = elements[0];
              if (onuuid) onuuid(tunnelUuid);
            }
            setState(Guacamole.Tunnel.State.OPEN);
          }

          if (opcode !== Guacamole.Tunnel.INTERNAL_DATA_OPCODE && oninstruction) {
            oninstruction(opcode, [...elements]);
          }

          elements.length = 0;
        }

        startIndex = elementEnd + 1;
      }
    };

    return {
      get state() { return tunnelState; },
      get uuid() { return tunnelUuid; },
      set uuid(v: string | null) { tunnelUuid = v; },
      receiveTimeout: 15000,
      unstableThreshold: 1500,

      set onerror(fn: any) { onerror = fn; },
      set onstatechange(fn: any) { onstatechange = fn; },
      set oninstruction(fn: any) { oninstruction = fn; },
      set onuuid(fn: any) { onuuid = fn; },

      isConnected() {
        return tunnelState === Guacamole.Tunnel.State.OPEN
          || tunnelState === Guacamole.Tunnel.State.UNSTABLE;
      },

      connect(data: string) {
        setState(Guacamole.Tunnel.State.CONNECTING);

        socket = new WebSocket(url);

        socket.onopen = () => {
          // Send JSON payload as initial WebSocket message (SSH-style)
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(data);
          }
        };

        socket.onmessage = (event) => {
          handleMessage(event.data);
        };

        socket.onclose = (event) => {
          closeTunnel(
            event.reason
              ? new Guacamole.Status(parseInt(event.reason) || 0, event.reason)
              : new Guacamole.Status(Guacamole.Status.Code.UPSTREAM_NOT_FOUND)
          );
        };

        socket.onerror = () => {
          closeTunnel(new Guacamole.Status(Guacamole.Status.Code.UPSTREAM_NOT_FOUND));
        };
      },

      sendMessage(...args: any[]) {
        if (!this.isConnected() || !socket || socket.readyState !== WebSocket.OPEN) return;
        if (args.length === 0) return;

        let message = `${String(args[0]).length}.${args[0]}`;
        for (let i = 1; i < args.length; i++) {
          const s = String(args[i]);
          message += `,${s.length}.${s}`;
        }
        message += ';';

        socket.send(message);
      },

      disconnect() {
        closeTunnel(new Guacamole.Status(Guacamole.Status.Code.SUCCESS, "Manually closed."));
      },
    };
  }

  const copyPassword = () => {
    if (!rdpPassword) return;
    navigator.clipboard.writeText(rdpPassword);
  };

  if (connectionType === 'rdp') {
    return (
      <div className="w-full h-full bg-[#0d1117] flex flex-col">
        <div className="flex items-center justify-between bg-[#161b22] border-b border-[#30363d] px-4 h-10 shrink-0">
          <div className="flex items-center gap-2">
            <Monitor className="text-[#238636]" size={14} />
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950]">RDP</span>
            <span className="text-xs text-[#8b949e]">
              {rdpStatus === 'connecting' && 'Connecting...'}
              {rdpStatus === 'connected' && 'Connected'}
              {rdpStatus === 'error' && 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {rdpPassword && (
              <button
                onClick={copyPassword}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded border border-[#30363d] transition-colors"
              >
                <Copy size={10} />
                Copy Password
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-[#000] flex items-center justify-center">
          {rdpStatus === 'connecting' && (
            <div className="flex flex-col items-center gap-3 text-[#8b949e]">
              <Loader2 size={32} className="animate-spin text-[#238636]" />
              <span className="text-sm">Establishing RDP session...</span>
            </div>
          )}
          {rdpStatus === 'error' && (
            <div className="flex flex-col items-center gap-3 text-[#8b949e] px-8 text-center">
              <Monitor size={48} className="opacity-20" />
              <span className="text-sm">RDP session disconnected</span>
              {rdpError && (
                <span className="text-xs text-[#f85149] max-w-md break-words">{rdpError}</span>
              )}
              {rdpPassword && !rdpError && (
                <span className="text-xs text-[#484f58]">Password was available before disconnect</span>
              )}
            </div>
          )}
          <div ref={rdpDisplayRef} className="inline-block" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#1a1b26] p-2 rounded-lg overflow-hidden shadow-2xl border border-[#24283b]">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
};

export default SSHClient;
