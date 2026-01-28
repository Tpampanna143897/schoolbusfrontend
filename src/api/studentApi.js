import client from './client';

export const studentApi = {
    getStudentByParent: (parentId) => client.get(`/students/parent/${parentId}`),
    getBusDetails: (busId) => client.get(`/bus/by-route/${busId}`), // Adjust based on swagger if needed
};
