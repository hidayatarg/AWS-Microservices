import { SwnDatabase } from './database';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SwnMicroservices } from './microservices';
import { SwnApiGateway } from './apigatway';
import { SwnEventBus } from './eventBus';
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

    const eventbus = new SwnEventBus(this, 'EventBus', {
      publisherFunction: microservice.basketMicroservice,
      targetFunction: ??
    });
  }
}
