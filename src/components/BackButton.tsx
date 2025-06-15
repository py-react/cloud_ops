import React, { useEffect, useState } from 'react';
import useNavigate from '@/libs/navigate';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const BackButton: React.FC<BackButtonProps> = ({ className = '', children }) => {
  const navigate = useNavigate();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleBack = () => {
    if (!canGoBack) {
      console.warn('No previous page to go back to');
      navigate('/', { replace: true });
      return;
    }

    // Get the previous path from history state
    const state = window.history.state;
    if (state && state.previousPath) {
      navigate(state.previousPath, { replace: true });
    } else {
      // If no previous path in state, go to root
      navigate('/', { replace: true });
    }
  };

  return (
    <Button 
      onClick={handleBack}
      variant={"ghost"}
      className={`mb-4 ${className}`}
      aria-label="Go back"
      disabled={!canGoBack}
    >
      <ArrowLeft className='w-4 h-4' />
    </Button>
  );
};

export default BackButton; 