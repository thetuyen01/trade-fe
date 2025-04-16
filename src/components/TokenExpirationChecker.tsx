import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

const TokenExpirationChecker = () => {
  const checkTokenExpiration = useAuthStore(
    (state) => state.checkTokenExpiration
  );

  useEffect(() => {
    // Check token expiration immediately when component mounts
    checkTokenExpiration();

    // Set up interval to check token expiration every minute
    const interval = setInterval(() => {
      checkTokenExpiration();
    }, 60000); // 60000 ms = 1 minute

    // Clean up the interval when component unmounts
    return () => clearInterval(interval);
  }, [checkTokenExpiration]);

  // This component doesn't render anything
  return null;
};

export default TokenExpirationChecker;
