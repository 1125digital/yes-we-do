export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, nombre, clave } = req.body;

  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`, // 🧪 debes configurarlo en Vercel
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'eventos@yeswe.app',
        to: email,
        subject: `Tu acceso a la boda`,
        html: `
          <p>Hola ${nombre},</p>
          <p>Gracias por registrarte en la boda.</p>
          <p>Tu clave personal es: <strong>${clave}</strong></p>
          <p>Si cierras esta ventana, puedes volver a entrar usando tu nombre y esta clave.</p>
        `
      }),
    });

    const data = await respuesta.json();

    return res.status(respuesta.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al enviar el correo', detalle: error.message });
  }
}
