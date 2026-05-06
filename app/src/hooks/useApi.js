import { useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useApi() {
  const { token, logout } = useAuth();
  const tokenRef = useRef(token);
  const logoutRef = useRef(logout);
  tokenRef.current = token;
  logoutRef.current = logout;

  const request = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (tokenRef.current) {
      headers['Authorization'] = `Bearer ${tokenRef.current}`;
    }

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      logoutRef.current();
      throw new Error('Unauthorized');
    }

    return res;
  }, []);

  const get = useCallback((url) => request(url), [request]);

  const post = useCallback((url, body) =>
    request(url, { method: 'POST', body: JSON.stringify(body) }), [request]);

  const put = useCallback((url, body) =>
    request(url, { method: 'PUT', body: JSON.stringify(body) }), [request]);

  const del = useCallback((url) =>
    request(url, { method: 'DELETE' }), [request]);

  return useMemo(() => ({ get, post, put, del }), [get, post, put, del]);
}
