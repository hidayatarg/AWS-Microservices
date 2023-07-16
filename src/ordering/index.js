const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
import { PutItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { ddbClient } from './ddbClient.js';

// business code
exports.handler = async function (event) {
    console.log('request:', JSON.stringify(event, undefined, 2));

    // TODO: Catch and Process Async EventBride Inovcation and Sync API Gateway Invocation

    const eventType = event['detail-type'];
    if (eventType !== undefined) {
        // Event Bridge Invocation
        await eventBridgeInvocation(event);
    } else {
        // API Gateway Invocation -> sync response
        return await apiGatewayInvocation(event);
    }
}

const eventBridgeInvocation = async (event) => {
    console.log('eventBridgeInvocation Function event :', event);

    // create order item in dynamodb
    await createOrder(event.detail);
}

const createOrder = async (basketCheckoutEvent) => {
    try {
        console.log('createOrder Function event :', basketCheckoutEvent);

        // set orderDate for Sort key for order dynamodb table
        const orderDate = new Date().toISOString();
        basketCheckoutEvent.orderDate = orderDate;
        console.log('createOrder Function event with orderDate :', basketCheckoutEvent);

        const params = {
            TableName: process.env.TABLE_NAME,
            Item: marshall(basketCheckoutEvent || {}),
        };
        // adding data to dynamodb table
        const createResult = await ddbClient.send(new PutItemCommand(params));
        console.log(createResult);
        return createResult;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

const apiGatewayInvocation = async (event) => {
    // GET /order
    // GET /order/{userName}
    let body;
    try {
        switch (event.httpMethod) {
            case "GET":
                if (event.pathParameters != null) {
                    body = await getOrder(event);
                } else {
                    body = await getAllOrders();
                }
                break;
            default:
                throw new Error(`Unsupported route: "${event.httpMethod}"`);
        }

        console.log(body);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully finished operation: "${event.httpMethod}"`,
                body: body
            }),
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to process operation",
                errorMsg: e.message,
                errorStack: e.stack
            }),
        };
    }
}

const getOrder = async (event) => {
    console.log("getOrder");
    // get order from dynamodb table
    try {
        // expected request: xxx/order/{userName}?orderDate=timestamp
        const userName = event.pathParameters.userName;
        const orderDate = event.queryStringParameters.orderDate;

        const params = {
            KeyConditionExpression: "userName = :userName and orderDate = :orderDate",
            ExpressionAttributeValues: {
                ":userName": { S: userName },
                ":orderDate": { S: orderDate }
            },
            TableName: process.env.DYNAMODB_TABLE_NAME,
        };

        const { Items } = await ddbClient.send(new QueryCommand(params));
        console.log(Items);
        return Items.map((item) => unmarshall(item));
    } catch (e) {
        console.error(e);
        throw e;
    }
};

const getAllOrders = async () => {
    console.log("getAllOrders");
    // get all orders from dynamodb table
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
        };

        const { Items } = await ddbClient.send(new ScanCommand(params));
        console.log(Items);
        return (Items)
            ? Items.map((item) => unmarshall(item))
            : {};
    } catch (e) {
        console.error(e);
        throw e;
    }
};