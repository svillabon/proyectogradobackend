const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ username, email, password, rol }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO usuarios (username, email, password_hash, rol, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, username, email, rol, created_at
    `;
    const values = [username, email, hashedPassword, rol];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM usuarios WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, username, email, rol, created_at FROM usuarios WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT id, username, email, rol, created_at FROM usuarios ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, { username, email, password, rol }) {
    let query, values;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `
        UPDATE usuarios
        SET username = $1, email = $2, password_hash = $3, rol = $4
        WHERE id = $5
        RETURNING id, username, email, rol, created_at
      `;
      values = [username, email, hashedPassword, rol, id];
    } else {
      query = `
        UPDATE usuarios
        SET username = $1, email = $2, rol = $3
        WHERE id = $4
        RETURNING id, username, email, rol, created_at
      `;
      values = [username, email, rol, id];
    }
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM usuarios WHERE id = $1';
    await pool.query(query, [id]);
    return true;
  }

  static async validatePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE usuarios SET password_hash = $1 WHERE id = $2 RETURNING id';
    const result = await pool.query(query, [hashedPassword, id]);
    return result.rows[0];
  }
}

module.exports = User;