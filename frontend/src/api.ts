import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  isActive: boolean;
}

export interface Competence {
  _id: string;
  employee: Employee;
  workstation: string;
  level: number;
  validUntil?: string;
}

export interface Shift {
  _id: string;
  employee: Employee | string;
  date: string;
  shiftTime: string;
  workstation: string;
}

export const fetchEmployees = async () => {
  const response = await api.get<Employee[]>('/employees');
  return response.data;
};

export const fetchCompetences = async () => {
  const response = await api.get<Competence[]>('/competences');
  return response.data;
};

export const fetchShifts = async () => {
  const response = await api.get<Shift[]>('/schedule');
  return response.data;
};

export const generateSchedule = async (startDate: string) => {
  const response = await api.post('/schedule/generate', { startDate });
  return response.data;
};

export const fetchAbsences = async () => {
  const response = await api.get('/absences');
  return response.data;
};

export const createAbsence = async (data: any) => {
  const response = await api.post('/absences', data);
  return response.data;
};

export const updateAbsenceStatus = async (id: string, status: string) => {
  const response = await api.put(`/absences/${id}`, { status });
  return response.data;
};

export default api;
