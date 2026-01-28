import client from './client';

export const driverApi = {
    getBuses: () => client.get('/driver/buses'),
    getActiveTrip: () => client.get('/driver/active-trip'),
    selectBus: (data) => client.post('/driver/select-bus', data),
    startTrip: (data) => client.post('/driver/start-trip', data),
    stopTrip: (data) => client.post('/driver/stop-trip', data),
    resumeTrip: (data) => client.post('/driver/resume-trip', data),
    endTrip: (data) => client.post('/driver/end-trip', data),
    getStudents: (busId) => client.get(`/students/bus/${busId}`),
    getRoutes: () => client.get('/routes'), // Non-admin route for selection
    markAttendance: (data) => client.post('/attendance', data),
};
