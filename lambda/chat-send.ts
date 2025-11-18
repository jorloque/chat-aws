import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  // Headers CORS para todas las respuestas
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // Manejar preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "JSON inválido" }),
    };
  }

  const { user, text, room = "general" } = body;

  if (!user || !text) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "user y text son obligatorios" }),
    };
  }

  const timestamp = Date.now();

  const item = {
    room: { S: room },
    timestamp: { N: String(timestamp) },
    user: { S: user },
    text: { S: text },
  };

  try {
    await client.send(
      new PutItemCommand({
        TableName: "ChatMessages",
        Item: item,
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "ok",
        message: { user, text, room, timestamp },
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error guardando el mensaje" }),
    };
  }
};