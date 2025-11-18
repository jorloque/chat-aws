import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "ChatMessages";

export const handler = async (event) => {
  console.log("EVENT:", JSON.stringify(event, null, 2));

  let { user, text, room } = event;

  if ((!user || !text) && event.body) {
    try {
      const body =
        typeof event.body === "string"
          ? JSON.parse(event.body)
          : event.body;
      user = body.user;
      text = body.text;
      room = body.room;
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "JSON inválido" }),
      };
    }
  }

  if (!user || !text) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "user y text son obligatorios" }),
    };
  }

  if (!room) room = "general"; // 👈 agregado

  const timestamp = Date.now();
  const message = { room, timestamp, user, text };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: message,
    })
  );

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "saved", message }),
  };
};
