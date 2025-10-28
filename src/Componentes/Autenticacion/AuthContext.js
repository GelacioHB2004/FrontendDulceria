import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // CORREGIDO: useEffect sin navigate en dependencias
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        try {
          // Validar token con el backend
          const response = await axios.get('https://backenddulceria.onrender.com/api/login/perfilF', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          
          const userData = response.data;
          setUser(userData);
          setToken(storedToken);

          // CORREGIDO: Solo redirigir si estamos en la página principal o login
          const publicRoutes = ['/', '/login', '/registro', '/verificar-correo'];
          if (publicRoutes.includes(location.pathname)) {
            redirectBasedOnUserType(userData.TipoUsuario);
          }
        } catch (error) {
          console.error('Token inválido o expirado:', error);
          // Limpiar localStorage si el token no es válido
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setUser(null);
          setToken(null);
        }
      }
      
      // IMPORTANTE: Siempre establecer loading en false
      setLoading(false);
    };

    initializeAuth();
  }, []); // CORREGIDO: Array vacío, sin dependencias

  const redirectBasedOnUserType = (tipoUsuario) => {
    switch (tipoUsuario) {
      case 'Cliente':
        navigate('/cliente', { replace: true });
        break;
      case 'Administrador':
        navigate('/admin', { replace: true });
        break;
      case 'Repartidor':
        navigate('/repartidor', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  const login = (userData, authToken) => {
    const { 
      id_usuarios, 
      Nombre, 
      ApellidoP, 
      ApellidoM, 
      Correo, 
      Telefono, 
      PreguntaSecreta, 
      RespuestaSecreta, 
      TipoUsuario, 
      Estado 
    } = userData;
    
    const userToStore = { 
      id_usuarios, 
      Nombre, 
      ApellidoP, 
      ApellidoM, 
      Correo, 
      Telefono, 
      PreguntaSecreta, 
      RespuestaSecreta, 
      TipoUsuario, 
      Estado 
    };
    
    setUser(userToStore);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userToStore));
    localStorage.setItem("token", authToken);
    
    // Redirección inmediata basada en TipoUsuario
    redirectBasedOnUserType(TipoUsuario);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate('/', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};