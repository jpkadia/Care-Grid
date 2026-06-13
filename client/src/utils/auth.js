const parseToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export const setSessionToken = (key, token) => {
  sessionStorage.setItem(key, token);
  localStorage.removeItem(key);
};

export const getSessionToken = (key) => {
  const token = sessionStorage.getItem(key) || localStorage.getItem(key);
  const payload = token ? parseToken(token) : null;
  if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
    return null;
  }
  if (!sessionStorage.getItem(key)) setSessionToken(key, token);
  return token;
};

export const clearSessionToken = (key) => {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
};
