import * as cdk from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsMicroservicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productTable = new Table(this, 'product', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'product',
      // it will destroy table when destory cdk is executed
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // lambda nodejs function -> using bundling and packaging features of it (more specifica)
    // including aws-sdk when creating the nodejs functions
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        PRIMARY_KEY: 'id',
        DYNAMODB_TABLE_NAME: productTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    };

    const productFunction = new NodejsFunction(this, 'productLambdaFunction', {
      entry: join(__dirname, `/../src/product/index.js`),
      ...nodeJsFunctionProps,
    });

    // give permission to the function to interact with product table for CRUD operations
    productTable.grantReadWriteData(productFunction);

    // Product microservice API Gateway
    // root name = product
    const apigw = new LambdaRestApi(this, 'productApi', {
      restApiName: 'Product Service',
      handler: productFunction,
      // create routes => not directing all a proxy
      proxy: false,
    });

    const product = apigw.root.addResource('product');
    product.addMethod('GET'); // GET /product
    product.addMethod('POST'); // POST /product

    const singleProduct = product.addResource('{id}'); // product/{id}
    singleProduct.addMethod('GET'); // GET /product/{id}
    singleProduct.addMethod('PUT'); // PUT /product/{id}
    singleProduct.addMethod('DELETE'); // DELETE /product/{id}
  }
}
