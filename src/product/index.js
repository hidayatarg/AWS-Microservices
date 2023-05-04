import { GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from './ddbClient';

// lambda function
exports.handler = async function (event) {
    console.log('request:', JSON.stringify(event, undefined, 2));

    // TODO: Switch case on event.httpmethod to perform CRUD operations
    switch (event.httpmethod) {
        case 'GET':
            if (event.pathParameters != null)
                body = await getProduct(event.pathParameters.id); // GET product/1
            else body = await getAllProducts(); // GET all products
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: `Hello from Product ! You've hit ${event.path}\n`,
    };
};

const getProduct = async (productId) => {
    console.log('getProduct:', productId);

    try {
        const params = {
            // the environment variable are injected while creating nodeJsFunction
            TableName: process.env.DYNAMODB_TABLE_NAME,
            // partication Id key
            Key: marshall({ id: productId }),
        };

        const { Item } = await ddbClient.send(new GetItemCommand(params));

        console.log(Item);
        return Item ? unmarshall(Item) : {};
    } catch (e) {
        console.error(e);
        throw e;
    }
};

const getAllProducts = async () => {
    console.log('getAllProducts');

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
