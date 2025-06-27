import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// --- Context for iframe mode ---
interface IframeContextType {
  isIframeMode: boolean;
  parentOrigin: string | null;
  notifyParent: (data: any) => void;
}

const IframeContext = createContext<IframeContextType | undefined>(undefined);

// --- Custom hook to use iframe context ---
export const useIframe = (): IframeContextType => {
  const context = useContext(IframeContext);
  if (context === undefined) {
    throw new Error('useIframe must be used within an IframeProvider');
  }
  return context;
};

// --- Props type for provider ---
interface IframeProviderProps {
  children: ReactNode;
}

// --- IframeProvider component ---
export const IframeProvider: React.FC<IframeProviderProps> = ({ children }) => {
  const [isIframeMode, setIsIframeMode] = useState(false);
  const [parentOrigin, setParentOrigin] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're in iframe mode by looking for the mode parameter
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'iframe') {
      setIsIframeMode(true);
      
      // Try to detect parent origin
      if (window.parent !== window) {
        // We're in an iframe, set up communication
        try {
          // Try to get referrer, fallback to common origins
          const referrer = document.referrer;
          if (referrer) {
            const referrerOrigin = new URL(referrer).origin;
            setParentOrigin(referrerOrigin);
          } else {
            // Common parent origins to try
            setParentOrigin('http://localhost:8097');
          }
        } catch (error) {
          setParentOrigin('http://localhost:8097');
        }
      }
    }
  }, []);

  const notifyParent = (data: any) => {
    if (isIframeMode && window.parent !== window && parentOrigin) {
      try {
        window.parent.postMessage({
          type: 'upconsent_iframe_message',
          ...data
        }, parentOrigin);
      } catch (error) {
        console.error('Failed to notify parent:', error);
      }
    }
  };

  return (
    <IframeContext.Provider value={{ isIframeMode, parentOrigin, notifyParent }}>
      {children}
    </IframeContext.Provider>
  );
};