import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface SwnEventBusProps {
  publisherFunction: IFunction;
  targetFunction: IFunction;
}

export class SwnEventBus extends Construct {
  constructor(scope: Construct, id: string, props: SwnEventBusProps) {
    super(scope, id);

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

    // pass target to Ordering Lambda Service
    checkoutBasketRule.addTarget(new LambdaFunction(props.targetFunction));

    // AccessDeniedException -> not authorized to perform this action events:PutEvents
    bus.grantPutEventsTo(props.publisherFunction);
  }
}
