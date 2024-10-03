import axios, { InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('authToken');
  const walletAddress = localStorage.getItem('walletAddress');

  // Ensure headers is an instance of AxiosHeaders
  const headers =
    config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (walletAddress) {
    headers.set('X-Wallet-Address', walletAddress);
  }

  // Return the config with the updated headers
  return { ...config, headers };
});

// New fileentry API methods
/* eslint-disable */
const fileentryApi = {
  getAll: (params?: any) => api.get('/fileentry', { params }),
  create: (data: any) => api.post('/fileentry', data),
  getOne: (id: string) => api.get(`/fileentry/${id}`),
  update: (id: string, data: any) => api.patch(`/fileentry/${id}`, data),
  delete: (id: string) => api.delete(`/fileentry/${id}`),
  getDeleted: (params?: any) => api.get('/fileentry/deleted', { params }),
  restore: (id: string) => api.post(`/fileentry/restore/${id}`),
  share: (data: any) => api.post('/fileentry/share', data),
  getShares: (fileId: string) => api.get(`/fileentry/share/${fileId}`),
  updateShare: (id: string, data: any) => api.put(`/fileentry/share/${id}`, data),
  removeShare: (id: string) => api.delete(`/fileentry/share/${id}`),
  getSharedWithMe: (params?: { page?: number; pageSize?: number }) =>
    api.get('/fileentry/shared', { params }),
  getPublic: (publicShareId: string) => api.get(`/fileentry/public/${publicShareId}`),
  getPublicShareAction: (id: string) => api.get(`/fileentry/${id}/share-public`),
  sharePublicly: (id: string, account: string) =>
    api.post(`/fileentry/${id}/share-public`, { account }),
  getNames: (params: { ids: string }) => api.get('/fileentry/names', { params }),
  duplicate: ({ id, name }: { id: string; name: string }) =>
    api.post(`/fileentry/${id}/duplicate`, { name }),
};

// User API methods
const userApi = {
  login: (data: any) => api.post('/user/login', data),
  register: (data: any) => api.post('/user', data),
  verify: () => api.get('/user/verify'),
  getStorage: () => api.get('/user/storage'),
};

// Storage API methods
const storageApi = {
  purchase: (data: any) => api.post('/storage/purchase', data),
  verify: (data: any) => api.post('/storage/verify', data),
};

const decryptApi = {
  sessionSigs: (data: any) => api.post('/decrypt/session_sigs', data),
};

const tipApi = {
  create: (data: any) => api.post('/api/tip', data),
};

// Combine all API methods
const apiClient = {
  fileentry: fileentryApi,
  user: userApi,
  storage: storageApi,
  decrypt: decryptApi,
  tip: tipApi,
};

export default apiClient;
