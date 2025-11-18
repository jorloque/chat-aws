import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
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
        ScanIndexForward: false, // más recientes primero
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({ messages }),
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Error leyendo mensajes" }),
    };
  }
};
