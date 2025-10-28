import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import zxcvbn from "zxcvbn";
import sha1 from "js-sha1";

const MySwal = withReactContent(Swal);

const API_BASE_URL = "https://backenddulceria.onrender.com";

function RegistroUsuarios() {
  const navigate = useNavigate();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [passwordError, setPasswordError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellidopa: "",
    apellidoma: "",
    telefono: "",
    correo: "",
    password: "",
    tipousuario: "Cliente", // Valor por defecto
    preguntaSecreta: "",
    respuestaSecreta: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "password") {
      const strength = zxcvbn(value);
      setPasswordStrength(strength.score);
      validatePassword(value);
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    validateField(name, value);
  };

  const validateField = (name, value) => {
    let errors = { ...formErrors };

    if (name === "nombre" || name === "apellidopa" || name === "apellidoma") {
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{4,16}$/;
      if (!nameRegex.test(value)) {
        errors[name] = "Solo letras entre 4 y 16 caracteres.";
      } else {
        delete errors[name];
      }
    }

    if (name === "telefono") {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(value)) {
        errors[name] = "Contener exactamente 10 dígitos.";
      } else {
        delete errors[name];
      }
    }

    if (name === "password") {
      const passwordRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,15}$/;
      if (!passwordRegex.test(value)) {
        errors[name] = "Tener entre 8 y 15 caracteres.";
      } else {
        delete errors[name];
      }
    }

    if (name === "correo") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[name] = "Introduce un correo electrónico válido.";
      } else {
        delete errors[name];
      }
    }

    if (name === "tipousuario") {
      // CORREGIDO: Validación para los tipos correctos
      if (!["Cliente", "Administrador", "Repartidor"].includes(value)) {
        errors[name] = "Selecciona un tipo de usuario válido.";
      } else {
        delete errors[name];
      }
    }

    if (name === "preguntaSecreta") {
      if (!value) {
        errors[name] = "Selecciona una pregunta de seguridad.";
      } else {
        delete errors[name];
      }
    }

    if (name === "respuestaSecreta") {
      if (value.length < 3) {
        errors[name] = "Mínimo 3 caracteres.";
      } else {
        delete errors[name];
      }
    }

    setFormErrors(errors);
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const commonPatterns = ["12345", "password", "qwerty", "abcdef"];
    let errorMessage = "";

    if (password.length < minLength) {
      errorMessage = `La contraseña debe tener al menos ${minLength} caracteres.`;
    }

    for (const pattern of commonPatterns) {
      if (password.toLowerCase().includes(pattern)) {
        errorMessage = "Evita usar secuencias comunes como '12345' o 'password'.";
        MySwal.fire({
          icon: "error",
          title: "Contraseña no válida",
          text: errorMessage,
        });
        break;
      }
    }

    setPasswordError(errorMessage);
  };

  const handlePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const checkPasswordCompromised = async (password) => {
    const hash = sha1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    try {
      const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
      const compromised = response.data.includes(suffix.toUpperCase());
      return compromised;
    } catch (error) {
      console.error("Error al verificar la contraseña en HIBP:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Datos enviados al backend:", formData);

    const isValidForm = Object.keys(formErrors).length === 0;

    if (!isValidForm || passwordError) {
      MySwal.fire({
        icon: "error",
        title: "Errores en el formulario",
        text: passwordError || "Por favor, corrige los errores antes de continuar.",
      });
      setIsLoading(false);
      return;
    }

    const isCompromised = await checkPasswordCompromised(formData.password);
    if (isCompromised) {
      MySwal.fire({
        icon: "error",
        title: "Contraseña comprometida",
        text: "Esta contraseña ha sido filtrada en brechas de datos. Por favor, elige otra.",
      });
      setIsLoading(false);
      return;
    }

    const dataToSend = {
      nombre: formData.nombre,
      apellidopa: formData.apellidopa,
      apellidoma: formData.apellidoma,
      correo: formData.correo,
      telefono: formData.telefono,
      password: formData.password,
      tipousuario: formData.tipousuario, // Ahora se envía correctamente
      preguntaSecreta: formData.preguntaSecreta,
      respuestaSecreta: formData.respuestaSecreta,
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/registro`, dataToSend);
      console.log("Respuesta del backend:", response.data);
      
      // CORREGIDO: Mejor manejo de la redirección
      await MySwal.fire({
        title: "¡Registro exitoso!",
        html: `
          <p>Tu registro se realizó correctamente como <strong>${response.data.tipousuario || formData.tipousuario}</strong>.</p>
          <p>Por favor revisa tu correo para verificar tu cuenta.</p>
        `,
        icon: "success",
        confirmButtonText: "Ir a verificar correo",
        background: '#f0fdf4',
        iconColor: '#22c55e'
      });
      
      // Redirigir después de cerrar el modal
      navigate("/verificar-correo");
      
    } catch (error) {
      console.error("Error al registrar el usuario:", error.response ? error.response.data : error.message);
      if (error.response && error.response.data.error) {
        MySwal.fire({
          icon: "error",
          title: "Error en el registro",
          text: error.response.data.error,
          background: '#fef2f2',
          iconColor: '#ef4444'
        });
      } else {
        MySwal.fire({
          icon: "error",
          title: "Error de conexión",
          text: "No te pudiste registrar. Por favor, intenta de nuevo.",
          background: '#fef2f2',
          iconColor: '#ef4444'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
        return "Muy Débil";
      case 1:
        return "Débil";
      case 2:
        return "Regular";
      case 3:
        return "Fuerte";
      case 4:
        return "Muy Fuerte";
      default:
        return "";
    }
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 0:
        return "#ef4444";
      case 1:
        return "#f97316";
      case 2:
        return "#eab308";
      case 3:
        return "#3b82f6";
      case 4:
        return "#22c55e";
      default:
        return "#d1d5db";
    }
  };

  return (
    <div className="registro-container">
      <form onSubmit={handleSubmit} className="registro-form">
        <h2>Registro de Usuario</h2>
        
        <div className="form-group">
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
          {formErrors.nombre && <span className="error">{formErrors.nombre}</span>}
        </div>

        <div className="form-group">
          <label>Apellido Paterno:</label>
          <input
            type="text"
            name="apellidopa"
            value={formData.apellidopa}
            onChange={handleChange}
            required
          />
          {formErrors.apellidopa && <span className="error">{formErrors.apellidopa}</span>}
        </div>

        <div className="form-group">
          <label>Apellido Materno:</label>
          <input
            type="text"
            name="apellidoma"
            value={formData.apellidoma}
            onChange={handleChange}
            required
          />
          {formErrors.apellidoma && <span className="error">{formErrors.apellidoma}</span>}
        </div>

        <div className="form-group">
          <label>Teléfono:</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            required
          />
          {formErrors.telefono && <span className="error">{formErrors.telefono}</span>}
        </div>

        <div className="form-group">
          <label>Correo:</label>
          <input
            type="email"
            name="correo"
            value={formData.correo}
            onChange={handleChange}
            required
          />
          {formErrors.correo && <span className="error">{formErrors.correo}</span>}
        </div>

        <div className="form-group">
          <label>Contraseña:</label>
          <div className="password-input-wrapper">
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button 
              type="button" 
              onClick={handlePasswordVisibility}
              className="toggle-password"
            >
              {passwordVisible ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {formErrors.password && <span className="error">{formErrors.password}</span>}
          
          {formData.password && (
            <div className="password-strength">
              <div 
                className="strength-bar"
                style={{
                  width: `${(passwordStrength + 1) * 20}%`,
                  backgroundColor: getStrengthColor(passwordStrength)
                }}
              />
              <span style={{ color: getStrengthColor(passwordStrength) }}>
                {getPasswordStrengthText(passwordStrength)}
              </span>
            </div>
          )}
        </div>

        {/* AGREGADO: Campo para seleccionar tipo de usuario */}
        <div className="form-group">
          <label>Tipo de Usuario:</label>
          <select
            name="tipousuario"
            value={formData.tipousuario}
            onChange={handleChange}
            required
          >
            <option value="Cliente">Cliente</option>
            <option value="Administrador">Administrador</option>
            <option value="Repartidor">Repartidor</option>
          </select>
          {formErrors.tipousuario && <span className="error">{formErrors.tipousuario}</span>}
        </div>

        <div className="form-group">
          <label>Pregunta de Seguridad:</label>
          <select
            name="preguntaSecreta"
            value={formData.preguntaSecreta}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona una pregunta</option>
            <option value="¿Cuál es el nombre de tu primera mascota?">
              ¿Cuál es el nombre de tu primera mascota?
            </option>
            <option value="¿En qué ciudad naciste?">
              ¿En qué ciudad naciste?
            </option>
            <option value="¿Cuál es tu comida favorita?">
              ¿Cuál es tu comida favorita?
            </option>
          </select>
          {formErrors.preguntaSecreta && <span className="error">{formErrors.preguntaSecreta}</span>}
        </div>

        <div className="form-group">
          <label>Respuesta de Seguridad:</label>
          <input
            type="text"
            name="respuestaSecreta"
            value={formData.respuestaSecreta}
            onChange={handleChange}
            required
          />
          {formErrors.respuestaSecreta && <span className="error">{formErrors.respuestaSecreta}</span>}
        </div>

        <button type="submit" disabled={isLoading} className="submit-btn">
          {isLoading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
    </div>
  );
}

export default RegistroUsuarios;