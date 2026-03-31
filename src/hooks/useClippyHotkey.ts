import { useState, useEffect, useCallback, useRef } from 'react';

interface CursorPosition {
  x: number;
  y: number;
}

export function useClippyHotkey() {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState<CursorPosition>({ x: 0, y: 0 });
  const mousePosRef = useRef<CursorPosition>({ x: 0, y: 0 });
  const isFirstActivation = useRef(true);

  const updateMousePos = useCallback((e: MouseEvent) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('mousemove', updateMousePos);
      return () => document.removeEventListener('mousemove', updateMousePos);
    }
  }, [isVisible, updateMousePos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      const isH = e.key.toLowerCase() === 'h';

      if (isModifier && isH) {
        e.preventDefault();

        const target = e.target as HTMLElement;
        const isEditable = 
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;

        if (!isEditable) {
          if (isFirstActivation.current) {
            mousePosRef.current = { x: e.clientX, y: e.clientY };
            setMousePos({ x: e.clientX, y: e.clientY });
            isFirstActivation.current = false;
          }
          setIsVisible((prev) => !prev);
        }
      }

      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hide = useCallback(() => setIsVisible(false), []);

  return { isVisible, mousePos, hide };
}
