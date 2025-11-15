import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"; // Adjust the base URL as needed
const register = async (name, email, password) => {
    console.log('API_URL', API_URL)
    console.log('name', name)
    console.log('email', email)
    console.log('password', password)
  try {
    const response = await axios.post(`${API_URL}/register`, {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || 'Registration failed');
  }
}

const login = async (email, password) => {
    try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    return response.data;
} catch (error) {
    throw new Error(error.response.data.message || 'Login failed');
  }
}

export default {
    register,
    login,
};                                    