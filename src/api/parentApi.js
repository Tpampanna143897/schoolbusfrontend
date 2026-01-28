import client from './client';

export const parentApi = {
    getChildren: () => client.get('/parent/my-children'),
    getBusLocation: (busId) => client.get(`/parent/bus-location/${busId}`),
    getAttendance: (studentId) => client.get(`/attendance/${studentId}`),
    getAttendanceHistory: (studentId) => client.get(`/attendance/history/${studentId}`),
};
