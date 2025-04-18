// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  try {
    const { email, nombre, clave } = await req.json();

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer re_Mjrzvpth_9mcS6VHPj2HVS8oFJFawXXZ3', // 🔁 Sustituye con tu API Key real
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

    const data = await response.json();

    return new Response(JSON.stringify({
      status: response.status,
      data
    }), {
      headers: { "Content-Type": "application/json" },
      status: response.status
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
