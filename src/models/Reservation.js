const pool = require('../config/database');

class Reservation {
  static async create({ usuario_id, espacio_id, fecha, hora_inicio, hora_fin, motivo, estado = 'pendiente', es_recurrente = false, tipo_recurrencia = null, dia_semana = null, fecha_fin_recurrencia = null, reserva_padre_id = null }) {
    const query = `
      INSERT INTO reservas (usuario_id, espacio_id, fecha, hora_inicio, hora_fin, motivo, estado, es_recurrente, tipo_recurrencia, dia_semana, fecha_fin_recurrencia, reserva_padre_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `;
    const values = [usuario_id, espacio_id, fecha, hora_inicio, hora_fin, motivo, estado, es_recurrente, tipo_recurrencia, dia_semana, fecha_fin_recurrencia, reserva_padre_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async createRecurrentReservations({ usuario_id, espacio_id, fecha_inicio, fecha_fin_recurrencia, hora_inicio, hora_fin, motivo, tipo_recurrencia, dia_semana }) {
    const reservations = [];
    const fechaInicio = new Date(fecha_inicio + 'T00:00:00');
    const fechaFin = new Date(fecha_fin_recurrencia + 'T00:00:00');
    
    // Crear la reserva padre con estado pendiente por defecto
    const reservaPadre = await this.create({
      usuario_id,
      espacio_id,
      fecha: fecha_inicio,
      hora_inicio,
      hora_fin,
      motivo,
      estado: 'pendiente',
      es_recurrente: true,
      tipo_recurrencia,
      dia_semana,
      fecha_fin_recurrencia
    });
    
    reservations.push(reservaPadre);
    
    // Generar reservas hijas según el tipo de recurrencia
    let fechaActual = new Date(fechaInicio);
    
    // Avanzar a la siguiente fecha según el tipo de recurrencia
    if (tipo_recurrencia === 'semanal') {
      fechaActual.setDate(fechaActual.getDate() + 7);
    } else if (tipo_recurrencia === 'mensual') {
      fechaActual.setMonth(fechaActual.getMonth() + 1);
    }
    
    while (fechaActual <= fechaFin) {
      const fechaStr = fechaActual.toISOString().split('T')[0];
      
      // Verificar conflictos antes de crear
      const hasConflict = await this.checkConflict(espacio_id, fechaStr, hora_inicio, hora_fin);
      
      if (!hasConflict) {
        const reservaHija = await this.create({
          usuario_id,
          espacio_id,
          fecha: fechaStr,
          hora_inicio,
          hora_fin,
          motivo,
          estado: 'pendiente',
          es_recurrente: false,
          tipo_recurrencia: null,
          dia_semana: null,
          fecha_fin_recurrencia: null,
          reserva_padre_id: reservaPadre.id
        });
        reservations.push(reservaHija);
      }
      
      // Avanzar a la siguiente fecha
      if (tipo_recurrencia === 'semanal') {
        fechaActual.setDate(fechaActual.getDate() + 7);
      } else if (tipo_recurrencia === 'mensual') {
        fechaActual.setMonth(fechaActual.getMonth() + 1);
      }
    }
    
    return reservations;
  }

  static async findAll(filters = {}, includeChildren = false) {
    let query = `
      SELECT r.*, 
             u.username, u.email, s.nombre as espacio_nombre,
             reviewer.username as reviewed_by_username,
             reviewer.email as reviewed_by_email,
             CASE 
               WHEN r.es_recurrente = true AND r.reserva_padre_id IS NULL 
               THEN COUNT(hijas.id) 
               ELSE 0 
             END as reservas_hijas_count
      FROM reservas r
      JOIN usuarios u ON r.usuario_id = u.id
      JOIN espacios s ON r.espacio_id = s.id
      LEFT JOIN usuarios reviewer ON r.reviewed_by = reviewer.id
      LEFT JOIN reservas hijas ON r.id = hijas.reserva_padre_id
    `;
    const values = [];
    const conditions = [];

    if (filters.usuario_id) {
      conditions.push(`r.usuario_id = $${values.length + 1}`);
      values.push(filters.usuario_id);
    }

    if (filters.espacio_id) {
      conditions.push(`r.espacio_id = $${values.length + 1}`);
      values.push(filters.espacio_id);
    }

    if (filters.fecha) {
      conditions.push(`r.fecha = $${values.length + 1}`);
      values.push(filters.fecha);
    }

    if (filters.estado) {
      conditions.push(`r.estado = $${values.length + 1}`);
      values.push(filters.estado);
    }

    // Para el admin panel, solo mostrar reservas padre o individuales
    // Para el calendario, mostrar todas las reservas
    if (!includeChildren) {
      conditions.push(`r.reserva_padre_id IS NULL`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY r.id, u.username, u.email, s.nombre, reviewer.username, reviewer.email';
    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT r.*, 
             u.username, u.email, s.nombre as espacio_nombre,
             reviewer.username as reviewed_by_username,
             reviewer.email as reviewed_by_email
      FROM reservas r
      JOIN usuarios u ON r.usuario_id = u.id
      JOIN espacios s ON r.espacio_id = s.id
      LEFT JOIN usuarios reviewer ON r.reviewed_by = reviewer.id
      WHERE r.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async updateStatus(id, estado, reviewedBy) {
    const query = `
      UPDATE reservas
      SET estado = $1, reviewed_by = $2, reviewed_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [estado, reviewedBy, id]);
    return result.rows[0] || null;
  }

  static async updateChildReservationsStatus(reservaPadreId, estado, reviewedBy) {
    const query = `
      UPDATE reservas
      SET estado = $1, reviewed_by = $2, reviewed_at = NOW()
      WHERE reserva_padre_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [estado, reviewedBy, reservaPadreId]);
    return result.rows;
  }

  static async checkConflict(espacio_id, fecha, hora_inicio, hora_fin, excludeId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM reservas
      WHERE espacio_id = $1
      AND fecha = $2
      AND estado != 'rechazado'
      AND (
        (hora_inicio <= $3 AND hora_fin > $3) OR
        (hora_inicio < $4 AND hora_fin >= $4) OR
        (hora_inicio >= $3 AND hora_fin <= $4)
      )
    `;
    const values = [espacio_id, fecha, hora_inicio, hora_fin];

    if (excludeId) {
      query += ' AND id != $5';
      values.push(excludeId);
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count) > 0;
  }

  static async getStats() {
    const queries = {
      reservasHoy: `
        SELECT COUNT(*) as count
        FROM reservas
        WHERE fecha = CURRENT_DATE
        AND estado = 'aprobado'
      `,
      reservasPendientes: `
        SELECT COUNT(*) as count
        FROM reservas
        WHERE estado = 'pendiente'
      `,
      espaciosDisponibles: `
        SELECT COUNT(*) as count
        FROM espacios
        WHERE id NOT IN (
          SELECT DISTINCT espacio_id
          FROM reservas
          WHERE fecha = CURRENT_DATE
          AND estado = 'aprobado'
        )
      `
    };

    const results = await Promise.all([
      pool.query(queries.reservasHoy),
      pool.query(queries.reservasPendientes),
      pool.query(queries.espaciosDisponibles)
    ]);

    return {
      reservasHoy: parseInt(results[0].rows[0].count),
      reservasPendientes: parseInt(results[1].rows[0].count),
      espaciosDisponibles: parseInt(results[2].rows[0].count)
    };
  }
}

module.exports = Reservation;