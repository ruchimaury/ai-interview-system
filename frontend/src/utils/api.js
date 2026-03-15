import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : '/api'
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (formData) => API.post('/auth/register', formData);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Jobs
export const getJobs = () => API.get('/jobs');
export const getJob = (id) => API.get(`/jobs/${id}`);
export const createJob = (data) => API.post('/jobs', data);
export const updateJob = (id, data) => API.put(`/jobs/${id}`, data);
export const deleteJob = (id) => API.delete(`/jobs/${id}`);

// Resume
export const uploadResume = (jobId, formData) => API.post(`/resume/upload/${jobId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Tests
export const getTest = (jobId) => API.get(`/tests/job/${jobId}`);
export const submitTest = (testId, data) => API.post(`/tests/submit/${testId}`, data);
export const createTest = (data) => API.post('/tests', data);
export const getAllTests = () => API.get('/tests');

// Interviews
export const getInterviewQuestions = (jobId) => API.get(`/interviews/questions/${jobId}`);
export const submitInterview = (appId, data) => API.post(`/interviews/submit/${appId}`, data);
export const faceVerify = (appId, data) => API.post(`/interviews/face-verify/${appId}`, data);

// Candidates
export const getMyApplications = () => API.get('/candidates/my-applications');
export const getApplication = (id) => API.get(`/candidates/application/${id}`);

// Admin
export const getDashboard = () => API.get('/admin/dashboard');
export const getAllApplications = (params) => API.get('/admin/applications', { params });
export const getApplicationDetail = (id) => API.get(`/admin/applications/${id}`);
export const getApplicationDetails = (id) => API.get(`/admin/applications/${id}`);
export const updateDecision = (id, data) => API.patch(`/admin/applications/${id}/decision`, data);
export const getRankings = (jobId) => API.get(`/admin/rankings/${jobId}`);
export const createAdmin = (data) => API.post('/auth/create-admin', data);

export default API;