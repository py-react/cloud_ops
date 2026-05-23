declare module 'guacamole-common-js' {
  export class WebSocketTunnel {
    constructor(wsProtocol: string, wsUrl: string);
    connect(data?: string): void;
    disconnect(): void;
    sendMessage(elements: any[]): void;
    onerror: ((error: any) => void) | null;
    oninstruction: ((opcode: string, args: string[]) => void) | null;
  }

  export class Client {
    constructor(tunnel: WebSocketTunnel);
    connect(data?: string): void;
    disconnect(): void;
    getDisplay(): Display;
    sendMouseState(state: MouseState): void;
    sendKeyEvent(pressed: number, keysym: number): void;
    sendEvent(event: any): void;
    onerror: ((error: string) => void) | null;
    onstatechange: ((state: number) => void) | null;
  }

  export class Display {
    getElement(): HTMLElement;
    onresize: ((width: number, height: number) => void) | null;
    scale(scale: number): void;
    showCursor(show: boolean): void;
  }

  export class Mouse {
    constructor(element: HTMLElement);
    onmousedown: ((state: MouseState) => void) | null;
    onmouseup: ((state: MouseState) => void) | null;
    onmousemove: ((state: MouseState) => void) | null;
  }

  export class MouseState {
    x: number;
    y: number;
    left: boolean;
    middle: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  }

  export class Keyboard {
    constructor(element: HTMLElement);
    onkeydown: ((keysym: number) => void) | null;
    onkeyup: ((keysym: number) => void) | null;
    reset(): void;
  }

  export class StringReader {
    constructor(str: string);
    ontext: ((text: string) => void) | null;
    oninstruction: ((opcode: string, args: string[]) => void) | null;
  }

  export class StringWriter {
    constructor();
    toString(): string;
    sendInstruction(opcode: string, ...args: string[]): void;
  }

  export class ArrayReader {
    constructor(elements: string[]);
    ontext: ((text: string) => void) | null;
    oninstruction: ((opcode: string, args: string[]) => void) | null;
  }

  export class AudioPlayer {
    constructor(types: string[]);
    onerror: ((error: any) => void) | null;
  }

  export class VideoPlayer {
    constructor(types: string[]);
    onerror: ((error: any) => void) | null;
  }

  export class BlobReader {
    constructor(mimetype: string);
    onprogress: ((received: number) => void) | null;
    onend: (() => void) | null;
    getBlob(): Blob;
  }

  export class InputStream {
    constructor(index: number);
    ondata: ((data: string) => void) | null;
    onend: (() => void) | null;
    sendAck(message: string, status: number): void;
  }

  export class OutputStream {
    constructor(index: number);
    sendBlob(data: string): void;
    sendEnd(): void;
  }
}
