import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import { useAuth } from '../Autenticacion/AuthContext';

// Material UI Components
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack,
  Security,
  Email,
  Lock,
  QrCode2,
  Login as LoginIcon,
} from '@mui/icons-material';

const MySwal = withReactContent(Swal);
const API_BASE_URL = "http://localhost:3000";

function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [step, setStep] = useState(0); // 0: Credenciales, 1: TOTP
  const [formData, setFormData] = useState({
    correo: "",
    password: "",
    userId: "",
    mfaCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const steps = ['Credenciales', 'Verificación TOTP'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.correo || !formData.password) {
      MySwal.fire({
        icon: "error",
        title: "Campos requeridos",
        text: "Ingresa tu correo y contraseña.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        correo: formData.correo,
        password: formData.password,
      });

      if (response.data.token) {
        handleSuccessfulLogin(response.data);
      } else if (response.data.userId) {
        setFormData((prev) => ({ ...prev, userId: response.data.userId }));
        setStep(1);
        MySwal.fire({
          icon: "info",
          title: "Verificación TOTP",
          text: "Ingresa el código de 6 dígitos de Google Authenticator.",
        });
      }
    } catch (error) {
      console.error("Error en login:", error);
      const errorMsg = error.response?.data?.error || "Error al iniciar sesión.";
      setError(errorMsg);
      MySwal.fire({
        icon: "error",
        title: "Error de login",
        text: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.mfaCode || formData.mfaCode.length !== 6) {
      MySwal.fire({
        icon: "error",
        title: "Código inválido",
        text: "Ingresa un código de 6 dígitos de Google Authenticator.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/login/verify-mfa`, {
        userId: formData.userId,
        mfaCode: formData.mfaCode,
      });

      if (response.data.token) {
        handleSuccessfulLogin(response.data);
      }
    } catch (error) {
      console.error("Error verificando TOTP:", error);
      const errorMsg = error.response?.data?.error || "Código TOTP inválido.";
      setError(errorMsg);
      MySwal.fire({
        icon: "error",
        title: "Error de verificación",
        text: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessfulLogin = (data) => {
    authLogin(data.user, data.token);
    // Mostrar alerta sin bloquear la redirección
    MySwal.fire({
      icon: "success",
      title: "¡Bienvenido!",
      text: "Sesión iniciada correctamente.",
      timer: 1500, // Cierra automáticamente después de 1.5 segundos
      showConfirmButton: false,
    });
    // Redirección inmediata (ya será manejada por AuthContext)
  };

  const goBack = () => {
    setStep(0);
    setFormData({ correo: "", password: "", userId: "", mfaCode: "" });
    setError("");
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Card
        elevation={8}
        sx={{
          width: '100%',
          borderRadius: 3,
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: 3
              }}
            >
              {step === 0 ? <LoginIcon fontSize="large" /> : <Security fontSize="large" />}
            </Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              {step === 0 ? "Iniciar Sesión" : "Verificación TOTP"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {step === 0
                ? "Ingresa tus credenciales para continuar"
                : "Ingresa el código de 6 dígitos de Google Authenticator"
              }
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Forms */}
          {step === 0 ? (
            // Paso 1: Credenciales
            <form onSubmit={handleLoginSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  name="correo"
                  type="email"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </Box>
            </form>
          ) : (
            // Paso 2: TOTP
            <form onSubmit={handleMFASubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Código TOTP (6 dígitos)"
                  name="mfaCode"
                  value={formData.mfaCode}
                  onChange={handleChange}
                  placeholder="123456"
                  inputProps={{
                    maxLength: 6,
                    style: {
                      textAlign: 'center',
                      fontSize: '1.2rem',
                      letterSpacing: '0.5em'
                    }
                  }}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <QrCode2 color="action" />
                      </InputAdornment>
                    ),
                  }}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />

                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Abre Google Authenticator y usa el código actual.
                </Typography>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading || formData.mfaCode.length !== 6}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Confirmar Código"
                  )}
                </Button>

                {/* Botón volver */}
                <Box sx={{ textAlign: 'center', pt: 2 }}>
                  <Button
                    startIcon={<ArrowBack />}
                    onClick={goBack}
                    color="primary"
                  >
                    Volver a credenciales
                  </Button>
                </Box>
              </Box>
            </form>
          )}

          {/* Link a registro */}
          <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              ¿No tienes cuenta?{" "}
              <Button
                onClick={() => navigate("/registro")}
                color="primary"
                sx={{ fontWeight: 'bold' }}
              >
                Regístrate aquí
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Login;