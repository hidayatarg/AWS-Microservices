import { DeleteItemCommand, GetItemCommand, PutItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from './ddbClient';
import { v4 as uuidv4 } from 'uuid';

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
    // function getAllBaskets
};

const createBasket = async (event) => {
    console.log('createBasket');
    // function createBasket
};

const deleteBasket = async (userName) => {
    console.log('deleteBasket');
    // function deleteBasket
};

const checkoutBasket = async (event) => {
    console.log('checkoutBasket');
    // function checkoutBasket
};