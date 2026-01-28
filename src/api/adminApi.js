import client from './client';

export const adminApi = {
    // User management
    getUsers: (role) => client.get(`/admin/users?role=${role}`),
    createUser: (userData) => client.post('/admin/users', userData),

    // Route management
    getRoutes: () => client.get('/admin/routes'),
    createRoute: (routeData) => client.post('/admin/routes', routeData),

    // Bus management
    getBuses: () => client.get('/admin/buses'),
    getLiveTrips: () => client.get('/admin/live-trips'),
    getTripLocation: (tripId) => client.get(`/admin/trip-location/${tripId}`),
    createBus: (busData) => client.post('/admin/buses', busData),
    updateBusStatus: (id, isActive) => client.put(`/admin/buses/${id}/status`, { isActive }),

    // Student management
    getStudents: () => client.get('/admin/students'),
    createStudent: (studentData) => client.post('/admin/students', studentData),
    updateStudent: (id, data) => client.put(`/admin/students/${id}`, data),
    reassignStudentRoute: (id, routeId) => client.put(`/admin/students/${id}/route`, { routeId }),
    reassignStudentBus: (id, busId) => client.put(`/admin/students/${id}/bus`, { busId }),
};
