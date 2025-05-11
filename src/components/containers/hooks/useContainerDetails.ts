import { useState } from 'react';
import type { Container } from 'src/types/container';

export function useContainerDetails() {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const showDetails = (container: Container) => {
    setErrorMessage(null)
    setSelectedContainer(container);
  };

  const showError = (errMsg: string) => {
    hideDetails()
    setErrorMessage(errMsg)
  };

  const hideDetails = () => {
    setSelectedContainer(null);
  };


  return {
    selectedContainer,
    showDetails,
    hideDetails,
    showError,
    errorMessage,
    editSelected:setEditing,
    editing
  };
}