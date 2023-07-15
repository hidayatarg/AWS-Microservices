const { marshall } = require("@aws-sdk/util-dynamodb");
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
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
    // implement function to get order from dynamodb table
};

const getAllOrders = async () => {
    console.log("getAllOrders");
    // implement function to get all orders from dynamodb table
};