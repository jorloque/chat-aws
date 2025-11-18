import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  // Headers CORS
  const headers = {
    "Content-Type": "application/json", 
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // Manejar preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const room = event.queryStringParameters?.room || "general";
  const limit = parseInt(event.queryStringParameters?.limit || "20", 10);

  try {
    const result = await client.send(
      new QueryCommand({
        TableName: "ChatMessages",
        KeyConditionExpression: "room = :room",
        ExpressionAttributeValues: {
          ":room": { S: room },
        },
        ScanIndexForward: false,
        Limit: limit,
      })
    );

    const messages = (result.Items || []).map((item) => ({
      room: item.room.S,
      timestamp: Number(item.timestamp.N),
      user: item.user.S,
      text: item.text.S,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ messages }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers, 
      body: JSON.strixngify({ error: "Error leyendo mensajes" }),
    };
  }
};