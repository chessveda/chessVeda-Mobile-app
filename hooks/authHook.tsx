import React, { useCallback, useEffect, useState } from "react";

let logoutTimer: NodeJS.Timeout | undefined;

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpirationDate, setTokenExpirationDate] = useState<Date | null>(
    null
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = useCallback(
    (uid: string, token: string, expirationDate?: Date) => {
      setToken(token);
      setUserId(uid);
      const calculatedExpirationDate =
        expirationDate ||
        new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365);
      setTokenExpirationDate(calculatedExpirationDate);
      localStorage.setItem(
        "userData",
        JSON.stringify({
          userId: uid,
          token: token,
          expiration: calculatedExpirationDate.toISOString(),
        })
      );
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setTokenExpirationDate(null);
    setUserId(null);
    localStorage.removeItem("userData");
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (
        parsedData &&
        parsedData.token &&
        new Date(parsedData.expiration) > new Date()
      ) {
        login(
          parsedData.userId,
          parsedData.token,
          new Date(parsedData.expiration)
        );
      }
    }
    setIsLoading(false);
  }, [login]);

  useEffect(() => {
    if (token && tokenExpirationDate) {
      const remainingTime =
        tokenExpirationDate.getTime() - new Date().getTime();
      logoutTimer = setTimeout(logout, remainingTime);
    } else {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
      }
    }
  }, [token, tokenExpirationDate, logout]);

  return { token, login, logout, userId, isLoading };
};