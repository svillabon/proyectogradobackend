-- Migración para agregar funcionalidad de reservas recurrentes
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS es_recurrente BOOLEAN DEFAULT FALSE;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS tipo_recurrencia VARCHAR(20) NULL; -- 'semanal', 'mensual'
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS dia_semana INTEGER NULL; -- 0=domingo, 1=lunes, etc.
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS fecha_fin_recurrencia DATE NULL;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS reserva_padre_id INTEGER NULL;

-- Añadir índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_reservas_recurrente ON reservas(es_recurrente);
CREATE INDEX IF NOT EXISTS idx_reservas_padre ON reservas(reserva_padre_id);

-- Añadir constraint para la relación padre-hijo
ALTER TABLE reservas ADD CONSTRAINT fk_reserva_padre 
FOREIGN KEY (reserva_padre_id) REFERENCES reservas(id) ON DELETE CASCADE;