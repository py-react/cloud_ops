import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigationHistory } from '@/libs/navigationHistory';
import useNavigate from '@/libs/navigate';

interface BackButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const BackButton: React.FC<BackButtonProps> = ({ className = '', children }) => {
  const navigate = useNavigate();
  const { canGoBack, goBack, historyChanged } = useNavigationHistory();
  const [canNavigateBack, setCanNavigateBack] = useState(false);

  useEffect(() => {
    const canGo = canGoBack();
    setCanNavigateBack(canGo);
  }, [historyChanged, canGoBack]);

  const handleBack = () => {
    if (!canNavigateBack) {
      navigate('/', { replace: true });
      return;
    }

    // Use linked list navigation - get the previous page path
    const previousPage = goBack();
    
    if (previousPage) {
      navigate(previousPage.path, { replace: true });
    } else {
      // Fallback to root if linked list navigation fails
      navigate('/', { replace: true });
    }
  };

  return (
    <Button 
      onClick={handleBack}
      variant={"ghost"}
      className={`mb-4 ${className}`}
      aria-label="Go back"
      disabled={!canNavigateBack}
    >
      <ArrowLeft className='w-4 h-4' />
    </Button>
  );
};

export default BackButton; 