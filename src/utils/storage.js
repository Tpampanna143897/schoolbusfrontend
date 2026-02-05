import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

export const storage = {
    async setItemAsync(key, value) {
        if (isWeb) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.error("Web Storage Error:", e);
            }
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },

    async getItemAsync(key) {
        if (isWeb) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.error("Web Storage Error:", e);
                return null;
            }
        } else {
            return await SecureStore.getItemAsync(key);
        }
    },

    async deleteItemAsync(key) {
        if (isWeb) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error("Web Storage Error:", e);
            }
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    }
};
