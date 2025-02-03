export const API_URL = import.meta.env.VITE_BACKEND_URL;

export const endpoints = {
  users: `${API_URL}/users/`,
  expenses: `${API_URL}/split/expenses/`,
  activity: `${API_URL}/split/expenses/activity/`,
  balances: `${API_URL}/split/expenses/balances`,
  settlements: `${API_URL}/split/expenses/settle/`,
  settlementHistory: `${API_URL}/split/expenses/settlements_history`,
  login: `${API_URL}/users/login/`,
  register: `${API_URL}/users/register/`,
};