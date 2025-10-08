const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const emailService = {
  async sendPasswordReset(email, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const { data, error } = await resend.emails.send({
        from: 'Sistema Reservas <noreply@resend.dev>',
        to: [email],
        subject: 'Recuperación de Contraseña - Sistema de Reservas',
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperación de Contraseña</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
              }
              .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                color: #1976d2;
                font-size: 24px;
                font-weight: bold;
              }
              .button {
                display: inline-block;
                background-color: #1976d2;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
              }
              .button:hover {
                background-color: #1565c0;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
              }
              .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🎓 Sistema de Reservas</div>
                <h2>Recuperación de Contraseña</h2>
              </div>
              
              <p>¡Hola!</p>
              
              <p>Has solicitado restablecer tu contraseña para el Sistema de Gestión de Reservas de Espacios Académicos.</p>
              
              <p>Para crear una nueva contraseña, haz clic en el siguiente enlace:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace es válido por 1 hora únicamente por motivos de seguridad.
              </div>
              
              <p>Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.</p>
              
              <p>Si tienes problemas con el enlace, copia y pega la siguiente URL en tu navegador:</p>
              <p style="word-break: break-all; color: #1976d2;">${resetUrl}</p>
              
              <div class="footer">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                <p>© 2025 Sistema de Gestión de Reservas de Espacios Académicos</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        console.error('Error enviando email:', error);
        throw new Error('Error al enviar el correo de recuperación');
      }

      console.log('Email enviado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('Error en emailService.sendPasswordReset:', error);
      throw error;
    }
  },

  async sendReservationStatusUpdate(email, reservation, newStatus, reviewerName) {
    try {
      const statusMessages = {
        aprobado: {
          subject: '✅ Reserva Aprobada',
          title: 'Tu reserva ha sido aprobada',
          message: 'Nos complace informarte que tu reserva ha sido aprobada.',
          color: '#4caf50'
        },
        rechazado: {
          subject: '❌ Reserva Rechazada', 
          title: 'Tu reserva ha sido rechazada',
          message: 'Lamentamos informarte que tu reserva ha sido rechazada.',
          color: '#f44336'
        }
      };

      const statusInfo = statusMessages[newStatus];
      
      const { data, error } = await resend.emails.send({
        from: 'Sistema Reservas <noreply@resend.dev>',
        to: [email],
        subject: `${statusInfo.subject} - Sistema de Reservas`,
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${statusInfo.subject}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
              }
              .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                color: #1976d2;
                font-size: 24px;
                font-weight: bold;
              }
              .status-badge {
                display: inline-block;
                background-color: ${statusInfo.color};
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: bold;
                margin: 10px 0;
              }
              .reservation-details {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
              }
              .detail-label {
                font-weight: bold;
                color: #555;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🎓 Sistema de Reservas</div>
                <h2>${statusInfo.title}</h2>
                <div class="status-badge">${newStatus.toUpperCase()}</div>
              </div>
              
              <p>${statusInfo.message}</p>
              
              <div class="reservation-details">
                <h3>Detalles de la Reserva</h3>
                <div class="detail-row">
                  <span class="detail-label">Espacio:</span>
                  <span>${reservation.espacio_nombre}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Fecha:</span>
                  <span>${reservation.fecha}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Hora:</span>
                  <span>${reservation.hora_inicio} - ${reservation.hora_fin}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Motivo:</span>
                  <span>${reservation.motivo}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Revisado por:</span>
                  <span>${reviewerName}</span>
                </div>
              </div>
              
              <div class="footer">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                <p>© 2025 Sistema de Gestión de Reservas de Espacios Académicos</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        console.error('Error enviando email:', error);
        throw new Error('Error al enviar la notificación por correo');
      }

      console.log('Email de estado de reserva enviado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('Error en emailService.sendReservationStatusUpdate:', error);
      throw error;
    }
  }
};

module.exports = emailService;