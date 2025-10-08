const pool = require('../config/database');

class Space {
  static async create({ nombre, capacidad, categoria, tipo, recursos, ubicacion, descripcion, imagen }) {
    const query = `
      INSERT INTO espacios (nombre, capacidad, categoria, tipo, recursos, ubicacion, descripcion, imagen)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [nombre, capacidad, categoria, tipo, JSON.stringify(recursos), ubicacion, descripcion, imagen];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM espacios ORDER BY nombre';
    const result = await pool.query(query);
    // Los recursos ya vienen como JSONB, no necesitan parseo
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM espacios WHERE id = $1';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    // Los recursos ya vienen como JSONB, no necesitan parseo
    return result.rows[0];
  }

  static async update(id, { nombre, capacidad, categoria, tipo, recursos, ubicacion, descripcion, imagen }) {
    const query = `
      UPDATE espacios
      SET nombre = $1, capacidad = $2, categoria = $3, tipo = $4, recursos = $5,
          ubicacion = $6, descripcion = $7, imagen = $8
      WHERE id = $9
      RETURNING *
    `;
    const values = [nombre, capacidad, categoria, tipo, JSON.stringify(recursos), ubicacion, descripcion, imagen, id];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;
    // Los recursos ya vienen como JSONB, no necesitan parseo
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM espacios WHERE id = $1';
    await pool.query(query, [id]);
    return true;
  }
}

module.exports = Space;