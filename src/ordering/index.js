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

const apiGatewayInvocation = async (event) => {

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