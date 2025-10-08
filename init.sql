-- Script de inicialización de la base de datos para el sistema de reservas

-- Crear base de datos
CREATE DATABASE reservas_db;
\c reservas_db;

-- Crear tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'profesor', 'estudiante')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de espacios
CREATE TABLE espacios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    categoria VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    recursos JSONB DEFAULT '[]',
    ubicacion VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    imagen VARCHAR(500)
);

-- Crear tabla de reservas
CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    espacio_id INTEGER NOT NULL REFERENCES espacios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    motivo TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    reviewed_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_horas CHECK (hora_fin > hora_inicio)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX idx_reservas_espacio ON reservas(espacio_id);
CREATE INDEX idx_reservas_fecha ON reservas(fecha);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_reservas_espacio_fecha ON reservas(espacio_id, fecha);

-- Insertar usuario administrador por defecto
-- Contraseña: admin123 (hasheada con bcrypt)
INSERT INTO usuarios (username, email, password_hash, rol) VALUES
('admin', 'admin@uni.edu.co', '$2b$10$OUdPJsAFjfFw7OJHK.aDhu6qxBYog/ewN.13I1ZJi8BuZocomcaD2', 'admin');

-- Insertar algunos espacios de ejemplo
INSERT INTO espacios (nombre, capacidad, categoria, tipo, recursos, ubicacion, descripcion, imagen) VALUES
('Laboratorio 301', 30, 'Aula', 'Aula', '["20 computadores", "1 tablero"]', 'Edificio Principal, tercer piso', 'Salon equipado con 20 computadores y 1 tablero.', 'https://i.postimg.cc/JtCD1Mfv/7.jpg'),
('Laboratorio 302', 25, 'Laboratorio', 'Laboratorio', '["20 computadores", "1 tablero", "1 Tv"]', 'Edificio Principal, tercer piso', 'Salon equipado con 20 computadores, 1 tablero y Tv.', 'https://i.postimg.cc/sX8F7Wmr/6.jpg'),
('Laboratorio 303', 20, 'Aula', 'Aula', '["20 computadores", "1 tablero"]', 'Edificio Principal, tercer piso', 'Salon equipado con 20 computadores y 1 tablero.', 'https://i.postimg.cc/JtCD1Mfv/7.jpg'),
('Laboratorio 304', 22, 'Laboratorio', 'Laboratorio', '["20 computadores", "1 tablero", "1 Tv"]', 'Edificio Principal, tercer piso', 'Salon equipado con 20 computadores, 1 tablero y Tv.', 'https://i.postimg.cc/sX8F7Wmr/6.jpg'),
('Laboratorio 305', 24, 'Aula', 'Aula', '["20 computadores", "1 tablero"]', 'Edificio Principal, tercer piso', 'Salon equipado con 20 computadores y 1 tablero.', 'https://i.postimg.cc/JtCD1Mfv/7.jpg'),
('Laboratorio 306', 28, 'Laboratorio', 'Laboratorio', '["20 computadores", "1 tablero", "1 Tv"]', 'Edificio Principal, tercer piso', 'Salon equipado con 20 computadores, 1 tablero y Tv.', 'https://i.postimg.cc/sX8F7Wmr/6.jpg'),
('Laboratorio 307', 23, 'Aula', 'Aula', '["20 computadores", "1 tablero"]', 'Edificio Principal, tercer piso', 'Salon equipado con 20 computadores y 1 tablero.', 'https://i.postimg.cc/JtCD1Mfv/7.jpg'),
('Laboratorio 308', 21, 'Laboratorio', 'Laboratorio', '["20 computadores", "1 tablero", "1 Tv"]', 'Edificio Principal, tercer piso', 'Salon equipado con 20 computadores, 1 tablero y Tv.', 'https://i.postimg.cc/sX8F7Wmr/6.jpg'),
('Laboratorio 309', 26, 'Aula', 'Aula', '["20 computadores", "1 tablero"]', 'Edificio Principal, tercer piso', 'Salon equipado con 20 computadores y 1 tablero.', 'https://i.postimg.cc/JtCD1Mfv/7.jpg'),
('Laboratorio 310', 27, 'Laboratorio', 'Laboratorio', '["20 computadores", "1 tablero", "1 Tv"]', 'Edificio Principal, tercer piso', 'Salon equipado con 20 computadores, 1 tablero y Tv.', 'https://i.postimg.cc/sX8F7Wmr/6.jpg'),
('Laboratorio 311', 29, 'Aula', 'Aula', '["20 computadores", "1 tablero"]', 'Edificio Principal, tercer piso', 'Salon equipado con 20 computadores y 1 tablero.', 'https://i.postimg.cc/JtCD1Mfv/7.jpg');


-- Insertar algunos usuarios de ejemplo
INSERT INTO usuarios (username, email, password_hash, rol) VALUES
('profesor1', 'profesor1@uni.edu.co', '$2b$10$OUdPJsAFjfFw7OJHK.aDhu6qxBYog/ewN.13I1ZJi8BuZocomcaD2', 'profesor'),
('estudiante1', 'estudiante1@uni.edu.co', '$2b$10$OUdPJsAFjfFw7OJHK.aDhu6qxBYog/ewN.13I1ZJi8BuZocomcaD2', 'estudiante'),
('estudiante2', 'estudiante2@uni.edu.co', '$2b$10$OUdPJsAFjfFw7OJHK.aDhu6qxBYog/ewN.13I1ZJi8BuZocomcaD2', 'estudiante');

-- Insertar algunas reservas de ejemplo
INSERT INTO reservas (usuario_id, espacio_id, fecha, hora_inicio, hora_fin, motivo, estado) VALUES
(2, 1, CURRENT_DATE + INTERVAL '1 day', '08:00', '10:00', 'Clase de Matemáticas', 'aprobado'),
(3, 2, CURRENT_DATE + INTERVAL '2 days', '14:00', '16:00', 'Práctica de laboratorio', 'pendiente'),
(4, 3, CURRENT_DATE + INTERVAL '3 days', '10:00', '12:00', 'Presentación de proyecto', 'aprobado');