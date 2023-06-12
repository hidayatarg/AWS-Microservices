import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunctionProps,
  NodejsFunction,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';

interface SwnMicroservicesProps {
  productTable: ITable;
  basketTable: ITable;
  orderTable: ITable;
}

export class SwnMicroservices extends Construct {
  // expose lambda function
  public readonly productMicroservice: NodejsFunction;
  public readonly basketMicroservice: NodejsFunction;
  public readonly orderingbasketMicroservice: NodejsFunction;

  constructor(scope: Construct, id: string, props: SwnMicroservicesProps) {
    super(scope, id);

    // product microservices
    this.productMicroservice = this.createProductFunction(props.productTable);
    // basket microservices
    this.basketMicroservice = this.createBasketFunction(props.basketTable);
    // order microservices
    this.orderingbasketMicroservice = this.createOrderingFunction(
      props.orderTable
    );
  }

  // lambda nodejs function -> using bundling and packaging features of it (more specifica)
  // including aws-sdk when creating the nodejs functions
  private createProductFunction(productTable: ITable): NodejsFunction {
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
    return productFunction;
  }

  private createBasketFunction(basketTable: ITable): NodejsFunction {
    const basketFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        PRIMARY_KEY: 'userName',
        DYNAMODB_TABLE_NAME: basketTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    };

    const basketFunction = new NodejsFunction(this, 'basketLambdaFunction', {
      entry: join(__dirname, `/../src/basket/index.js`),
      ...basketFunctionProps,
    });

    // give permission to the function to interact with product table for CRUD operations
    basketTable.grantReadWriteData(basketFunction);
    return basketFunction;
  }

  createOrderingFunction(orderTable: ITable): NodejsFunction {
    const orderingFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ['aws-sdk'], // use the 'aws-sdk' module in the lambda function runtime
      },
      environment: {
        PRIMARY_KEY: 'userName',
        SORT_KEY: 'orderDate',
        DYNAMODB_TABLE_NAME: orderTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    };

    const orderFunction = new NodejsFunction(this, 'orderingLambdaFunction', {
      entry: join(__dirname, `/../src/ordering/index.js`),
      ...orderingFunctionProps,
    });

    orderTable.grantReadWriteData(orderFunction);
    return orderFunction;
  }
}
