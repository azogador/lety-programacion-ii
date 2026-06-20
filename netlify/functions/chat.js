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

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "No se encontró la variable OPENAI_API_KEY en Netlify."
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

    const respuestaOpenAI = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
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

    const data = await respuestaOpenAI.json();

    if (!respuestaOpenAI.ok) {
      return {
        statusCode: respuestaOpenAI.status,
        body: JSON.stringify({
          error: "OpenAI devolvió un error.",
          detalle: data.error?.message || JSON.stringify(data)
        })
      };
    }

    const texto =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
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
