import { ApiGatewayManagementApi } from "@aws-sdk/client-apigatewaymanagementapi";

export const handler = async (event) => {
  console.log("Evento recibido:", JSON.stringify(event, null, 2));

  const { requestContext, body } = event;

  let parsedBody = {};

  // Parseo tolerante
  try {
    parsedBody = JSON.parse(body);
  } catch (err) {
    console.log("Body no es JSON, lo tratamos como texto.");
    parsedBody.data = body;
  }

  const message = parsedBody.data || "mensaje vacío";

  const domain = requestContext.domainName;
  const stage = requestContext.stage;

  const apiGw = new ApiGatewayManagementApi({
    endpoint: `https://${domain}/${stage}`,
  });

  try {
    await apiGw.postToConnection({
      ConnectionId: requestContext.connectionId,
      Data: Buffer.from(`Echo: ${message}`)
    });

    return { statusCode: 200 };
  } catch (err) {
    console.error("ERROR al enviar mensaje:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send message" }),
    };
  }
};
