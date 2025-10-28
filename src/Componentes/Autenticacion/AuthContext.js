import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Estado de carga
  const navigate = useNavigate();

  // Carga y valida desde localStorage al montar
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        try {
          const response = await axios.get('https://backenddulceria.onrender.com/api/login/perfilF', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
          setToken(storedToken);
          // Redirección basada en TipoUsuario
          redirectBasedOnUserType(response.data.TipoUsuario);
        } catch (error) {
          console.error('Token inválido o expirado:', error);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [navigate]);

  const redirectBasedOnUserType = (tipoUsuario) => {
    switch (tipoUsuario) {
      case 'Cliente':
        navigate('/cliente');
        break;
      case 'Administrador':
        navigate('/admin');
        break;
      case 'Repartidor':
        navigate('/repartidor');
        break;
      default:
        navigate('/');
    }
  };

  const login = (userData, authToken) => {
    const { id_usuarios, Nombre, ApellidoP, ApellidoM, Correo, Telefono, PreguntaSecreta, RespuestaSecreta, TipoUsuario, Estado } = userData;
    const userToStore = { id_usuarios, Nombre, ApellidoP, ApellidoM, Correo, Telefono, PreguntaSecreta, RespuestaSecreta, TipoUsuario, Estado };
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
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);