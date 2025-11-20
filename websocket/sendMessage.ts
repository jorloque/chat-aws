import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  DeleteItemCommand
} from "@aws-sdk/client-dynamodb";

import { ApiGatewayManagementApi } from "@aws-sdk/client-apigatewaymanagementapi";

const ddb = new DynamoDBClient({});
const CONNECTIONS_TABLE = "ChatConnections";
const MESSAGES_TABLE = "ChatMessages";
const ROOM_ID = "general";

export const handler = async (event) => {
  console.log("SEND MESSAGE:", JSON.stringify(event, null, 2));

  const { connectionId, domainName, stage } = event.requestContext;

  // Parsear body
  let body;
  try { body = JSON.parse(event.body); }
  catch { body = { data: event.body }; }

  const text = body.data?.trim() || "";
  if (!text) return { statusCode: 400 };

  // Obtener username correcto
  const userItem = await ddb.send(new GetItemCommand({
    TableName: CONNECTIONS_TABLE,
    Key: { connectionId: { S: connectionId } }
  }));

  const username = userItem.Item?.username?.S || "Anon";

  const createdAt = new Date().toISOString();

  // Guardar mensaje
  await ddb.send(new PutItemCommand({
    TableName: MESSAGES_TABLE,
    Item: {
      roomId: { S: ROOM_ID },
      createdAt: { S: createdAt },
      user: { S: username },
      text: { S: text }
    }
  }));

  // Obtener todas las conexiones activas
  const conns = await ddb.send(new ScanCommand({
    TableName: CONNECTIONS_TABLE
  }));

  const apiGw = new ApiGatewayManagementApi({
    endpoint: `https://${domainName}/${stage}`
  });

  const msg = {
    type: "message",
    user: username,
    text,
    createdAt
  };

  // Broadcast
  for (const conn of conns.Items) {
    try {
      await apiGw.postToConnection({
        ConnectionId: conn.connectionId.S,
        Data: Buffer.from(JSON.stringify(msg))
      });
    } catch (err) {
      await ddb.send(new DeleteItemCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId: { S: conn.connectionId.S } }
      }));
    }
  }

  return { statusCode: 200 };
};
