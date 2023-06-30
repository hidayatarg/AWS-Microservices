import { DeleteItemCommand, GetItemCommand, PutItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from './ddbClient';
import { ebClient } from './eventBridgeClient';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';

// lambda function
exports.handler = async function (event) {
    console.log('request:', JSON.stringify(event, undefined, 2));
    // TODO: Switch case on event.httpMethod to perform add/remove basket
    // and checkout basket operations with using ddbClient object

    // GET /basket
    // POST /basket
    // GET /basket/{userName}
    // DELETE /basket/{userName}
    // POST /basket/checkout


    let body;
    try {
        switch (event.httpMethod) {
            case 'GET':
                if (event.pathParameters != null) {
                    body = await getBasket(event.pathParameters.userName); // GET /basket/{userName}
                } else {
                    body = await getAllBaskets(); // GET /basket
                }
                break;
            case 'POST':
                if (event.path == "/basket/checkout") {
                    body = await checkoutBasket(event); // POST /basket/checkout
                } else {
                    body = await createBasket(event); // POST /basket
                }
                break;
            case "DELETE":
                body = await deleteBasket(event.pathParameters.userName); // DELETE /basket
                break;
            default:
                throw new Error(`Unsupported route: "${event.httpmethod}"`);
        }
        console.log("body: ", body);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully finished operation: "${event.httpMethod}"`,
                body: body
            })
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to perform operation.",
                errorMsg: e.message,
                errorStack: e.stack,
            })
        };
    }
};

const getBasket = async (userName) => {
    console.log('getBasket');
    try {
        const params = {
            // the environment variable are injected while creating nodeJsFunction
            TableName: process.env.DYNAMODB_TABLE_NAME,
            // partication userName key
            Key: marshall({ userName: userName }),
        };

        const { Item } = await ddbClient.send(new GetItemCommand(params));

        console.log(Item);
        return Item ? unmarshall(Item) : {};
    } catch (e) {
        console.error(e);
        throw e;
    }
};

const getAllBaskets = async () => {
    console.log('getAllBaskets');
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME
        };

        const { Items } = await ddbClient.send(new ScanCommand(params));

        console.log(Items);
        return (Items) ? Items.map((item) => unmarshall(item)) : {};

    } catch (e) {
        console.error(e);
        throw e;
    }
};

const createBasket = async (event) => {
    console.log('createBasket');
    try {
        // for cloudwatch
        console.log(`createBasket function. event : "${event}"`);

        const requestBody = JSON.parse(event.body);
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(requestBody || {})
        };

        const createResult = await ddbClient.send(new PutItemCommand(params));
        console.log(createResult);
        return createResult;

    } catch (e) {
        console.error(e);
        throw e;
    }
};

const deleteBasket = async (userName) => {
    console.log(`delete Basket, username: "${userName}"`);

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ userName: userName }),
        };

        const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
        console.log(deleteResult);
        return deleteResult;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

const checkoutBasket = async (event) => {
    console.log('checkoutBasket');
    // expected payload : {userName: swn, attributes[firstName, lastName, email ...]}
    // reach the body from event.body

    const checkoutRequest = JSON.parse(event.body);
    if (checkoutBasket == null || checkoutRequest.userName == null) {
        throw new Error(`userName should exists in the checkoutRequest: "${checkoutRequest.userName}"`);
    }

    //1- getting existing basket with items
    const basket = await getBasket(checkoutRequest.userName);

    //2- create an event json object with basket item, 
    //calculate total price, prepare order create json object to send ordering microservices
    const checkoutPayload = prepareOrderPayload(checkoutRequest, basket);

    //3- publish event to event bridge - this will be subscribe by order microservice
    const publishedEvent = await publishCheckoutBasketEvent(checkoutPayload);

    //4- removing the exiting basket
    await deleteBasket(checkoutRequest.userName);
};

const prepareOrderPayload = (checkoutRequest, basket) => {
    console.log('prepareOrderPayload');
    // prepare order payload -> calculate total price, combine checkout
    // aggregate and enrich request and basket data in order to create order payload

    try {
        // validation of basket
        if (basket == null || basket.items == null) {
            throw new Error(`basket should exists in items: "${basket}"`);
        }

        // calculate total price
        let totalPrice = 0;
        basket.items.forEach(item => totalPrice = totalPrice + item.price);
        checkoutRequest.totalPrice = totalPrice;
        console.log(checkoutRequest);

        // copies all properties from basket into checkoutRequest
        Object.assign(checkoutRequest, basket);
        console.log("Success prepareOrderPayload, orderPayload: ", checkoutRequest);
        return checkoutRequest;

    } catch (e) {
        console.error(e);
        throw e;
    }
}

const publishCheckoutBasketEvent = async (checkoutPayload) => {
    // putEventsCommand to put event to event bridge
    console.log('publishCheckoutBasketEvent with payload :', checkoutPayload);

    try {
        const params = {
            Entries: [
                {
                    Source: 'com.swn.basket.checkoutbasket',
                    Detail: JSON.stringify(checkoutPayload),
                    DetailType: 'CheckoutBasket',
                    Resources: [],
                    EventBusName: "SwnEventBus",
                },
            ],
        };

        const publishResult = await ebClient.send(new PutEventsCommand(params));
        console.log("Sucess, event sent; requestID: ", publishResult);

        return publishResult;
    } catch (e) {
        console.log(e);
        throw e;
    }
}