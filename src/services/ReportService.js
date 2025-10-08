const pool = require('../config/database');

class ReportService {
  static async generarReportes(filtros = {}) {
    try {
      const { fechaInicio, fechaFin, espacio, usuario, estado } = filtros;

      // Construir condiciones WHERE
      const conditions = [];
      const values = [];

      if (fechaInicio) {
        conditions.push(`r.fecha >= $${values.length + 1}`);
        values.push(fechaInicio);
      }

      if (fechaFin) {
        conditions.push(`r.fecha <= $${values.length + 1}`);
        values.push(fechaFin);
      }

      if (espacio) {
        conditions.push(`r.espacio_id = $${values.length + 1}`);
        values.push(parseInt(espacio));
      }

      if (usuario) {
        conditions.push(`r.usuario_id = $${values.length + 1}`);
        values.push(parseInt(usuario));
      }

      if (estado) {
        conditions.push(`r.estado = $${values.length + 1}`);
        values.push(estado);
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      // 1. Estadísticas generales
      const statsQuery = `
        SELECT 
          COUNT(*) as total_reservas,
          COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as reservas_aprobadas,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as reservas_pendientes,
          COUNT(CASE WHEN estado = 'rechazado' THEN 1 END) as reservas_rechazadas
        FROM reservas r
        ${whereClause}
      `;
      const statsResult = await pool.query(statsQuery, values);
      const stats = statsResult.rows[0];

      // 2. Reservas por espacio
      const espaciosQuery = `
        SELECT s.nombre as espacio, COUNT(r.id) as cantidad
        FROM reservas r
        JOIN espacios s ON r.espacio_id = s.id
        ${whereClause}
        GROUP BY s.id, s.nombre
        ORDER BY cantidad DESC
      `;
      const espaciosResult = await pool.query(espaciosQuery, values);

      // 3. Reservas por usuario
      const usuariosQuery = `
        SELECT u.username as usuario, u.email, u.rol, COUNT(r.id) as cantidad
        FROM reservas r
        JOIN usuarios u ON r.usuario_id = u.id
        ${whereClause}
        GROUP BY u.id, u.username, u.email, u.rol
        ORDER BY cantidad DESC
        LIMIT 10
      `;
      const usuariosResult = await pool.query(usuariosQuery, values);

      // 4. Reservas por mes
      const mesesQuery = `
        SELECT 
          TO_CHAR(r.fecha, 'YYYY-MM') as mes,
          COUNT(r.id) as cantidad
        FROM reservas r
        ${whereClause}
        GROUP BY TO_CHAR(r.fecha, 'YYYY-MM')
        ORDER BY mes DESC
        LIMIT 12
      `;
      const mesesResult = await pool.query(mesesQuery, values);

      // 5. Distribución por estado
      const estadosData = [
        { estado: 'Aprobado', cantidad: parseInt(stats.reservas_aprobadas), color: '#4caf50' },
        { estado: 'Pendiente', cantidad: parseInt(stats.reservas_pendientes), color: '#ff9800' },
        { estado: 'Rechazado', cantidad: parseInt(stats.reservas_rechazadas), color: '#f44336' }
      ].filter(item => item.cantidad > 0);

      // 6. Espacios más usados con porcentajes
      const totalReservas = parseInt(stats.total_reservas);
      const espaciosMasUsados = espaciosResult.rows.map(espacio => ({
        nombre: espacio.espacio,
        reservas: parseInt(espacio.cantidad),
        porcentaje: totalReservas > 0 ? (parseInt(espacio.cantidad) / totalReservas) * 100 : 0
      })).slice(0, 5);

      // 7. Usuarios más activos
      const usuariosMasActivos = usuariosResult.rows.map(usuario => ({
        username: usuario.usuario,
        email: usuario.email,
        reservas: parseInt(usuario.cantidad),
        rol: usuario.rol
      }));

      return {
        totalReservas: parseInt(stats.total_reservas),
        reservasAprobadas: parseInt(stats.reservas_aprobadas),
        reservasPendientes: parseInt(stats.reservas_pendientes),
        reservasRechazadas: parseInt(stats.reservas_rechazadas),
        reservasPorEspacio: espaciosResult.rows.map(row => ({
          espacio: row.espacio,
          cantidad: parseInt(row.cantidad)
        })),
        reservasPorUsuario: usuariosResult.rows.map(row => ({
          usuario: row.usuario,
          email: row.email,
          cantidad: parseInt(row.cantidad),
          rol: row.rol
        })),
        reservasPorMes: mesesResult.rows.map(row => ({
          mes: row.mes,
          cantidad: parseInt(row.cantidad)
        })).reverse(),
        reservasPorEstado: estadosData,
        espaciosMasUsados,
        usuariosMasActivos
      };
    } catch (error) {
      console.error('Error generando reportes:', error);
      throw error;
    }
  }
}

module.exports = ReportService;