import {useState, useEffect, useRef} from 'react';

const useGoogleOdic = (onSuccess, onFailure) => {
  const popupRef = useRef(null);

  useEffect(() => {
    const handleMessage = (e) => {
      const allowedSenderOrigins = [
        'http://localhost:3000',
      ]

      if (!allowedSenderOrigins.includes(e.origin)) return;

      const data = e.data;

      if (data.type === 'OAUTH_SUCCESS')
        onSuccess(data.accessToken);
      else if (data.type === 'OAUTH_FAILURE')
        onFailure(data.message);

      if (popupRef) {
        popupRef.current.close();
        popupRef.current = null;
      }
    }

    window.addEventListener('message', handleMessage);
  }, [onSuccess, onFailure]);

  const initiateLogin = () => {
    const frontendOrigin = window.location.origin;
    const newPopup = window.open(
      `http://localhost:3000/api/login/google?origin=${frontendOrigin}`,
      'GoogleOAuth',
      'width=600,height=600'
    );
    popupRef.current = newPopup;
  }

  return initiateLogin;
}

export default useGoogleOdic;