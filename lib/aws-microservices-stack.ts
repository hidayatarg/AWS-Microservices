import { SwnDatabase } from './database';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SwnMicroservices } from './microservices';
import { SwnApiGateway } from './apigatway';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsMicroservicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const database = new SwnDatabase(this, 'Database');

    const microservice = new SwnMicroservices(this, 'Microservices', {
      productTable: database.productTable,
      basketTable: database.basketTable,
    });

    const apigateway = new SwnApiGateway(this, 'Apigateway', {
      productMicroservice: microservice.productMicroservice,
      basketMicroservice: microservice.basketMicroservice,
    });

    //eventbus
    const bus = new EventBus(this, 'SwnEventBus', {
      eventBusName: 'SwnEventBus',
    });

    const checkoutBasketRule = new Rule(this, 'CheckoutBasketRule', {
      eventBus: bus,
      enabled: true,
      description: 'When basket microservice checkout the basket',
      eventPattern: {
        source: ['com.swn.basket.checkoutbasket'],
        detailType: ['CheckoutBasket'],
      },
      ruleName: 'CheckoutBasketRule',
    });

    checkoutBasketRule.addTarget(new LambdaFunction(orderingMicroservice));
    // pass target to Ordering Lambda Service
  }
}
