import { set } from "date-fns";
import { useState, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

function useIsMobile() {
  const location = useLocation();
  const [atHome, setAtHome] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {

    function updateSize() {
      if (location.pathname === '/home')
        setAtHome(true);
      else
        setAtHome(false);

      if (window.innerWidth < 768)
        setIsMobile(true);
      else 
        setIsMobile(false);
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    return () => {
      window.removeEventListener('resize', updateSize);
    }
  }, [location]);

  return [atHome, isMobile];
}

export default useIsMobile;