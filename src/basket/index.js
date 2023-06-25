import { DeleteItemCommand, GetItemCommand, PutItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from './ddbClient';

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
    // function checkoutBasket
    // asynchronous communication -> event bridge
    // publish event -> event bridge, 
    // it will subscribe by order microservice and start ordering process

    //1- getting existing basket with items

    //2- create an event json object with basket item, 
    // calculate total price, prepare order create json object to send ordering microservices


    //3- publish event to event bridge - this will be subscribe by order microservice


    //4- removing the exiting basket

};