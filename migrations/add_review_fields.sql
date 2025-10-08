-- Migración: Agregar campos de revisión a reservas
-- Fecha: 2025-10-02
-- Descripción: Agrega columnas para rastrear quién aprobó/rechazó cada reserva

\c reservas_db;

-- Agregar columnas si no existen
ALTER TABLE reservas 
ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_reservas_reviewed_by ON reservas(reviewed_by);

-- Actualizar reservas existentes aprobadas/rechazadas para asignar al admin como revisor
UPDATE reservas
SET reviewed_by = (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1),
    reviewed_at = CURRENT_TIMESTAMP
WHERE estado IN ('aprobado', 'rechazado') 
AND reviewed_by IS NULL;

-- Mensaje de confirmación
SELECT 'Migración completada exitosamente' as mensaje;
