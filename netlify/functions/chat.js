exports.handler = async function(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({
          error: "Método no permitido."
        })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const mensaje = body.mensaje || "";

    if (!mensaje.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "El mensaje está vacío."
        })
      };
    }

    const systemPrompt = `
Sos una IA de acompañamiento didáctico para Programación II.

Tu función:
- Acompañar el razonamiento de Lety.
- Hacer preguntas breves.
- Ayudar a ordenar ideas.
- Pedir que explique con sus palabras.
- No entregar soluciones completas de código de entrada.
- No actuar como Codex.
- No reemplazar al docente.
- Recordar que el avance del recorrido depende de la verificación docente presencial.

Estilo:
- Español claro.
- Tono amable.
- Respuestas breves.
- Máximo 6 líneas.
- Una pregunta por vez cuando sea posible.

Contexto conceptual:
El recorrido se basa en la idea:
ESTUDIANTE = pantalla + IA + web + presencia docente.

La pantalla muestra la web y la conversación con IA.
La IA acompaña.
El docente observa, pregunta, verifica la pantalla del estudiante y decide si continúa el recorrido.
`;

    const respuesta = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: mensaje
          }
        ]
      })
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return {
        statusCode: respuesta.status,
        body: JSON.stringify({
          error: data.error?.message || "Error al llamar a la API."
        })
      };
    }

    const texto =
      data.output?.[0]?.content?.[0]?.text ||
      data.output_text ||
      "No pude generar una respuesta en este momento.";

    return {
      statusCode: 200,
      body: JSON.stringify({
        respuesta: texto
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error interno en la función.",
        detalle: error.message
      })
    };
  }
};
