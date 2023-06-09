import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface SwnApiGatewayProps {
  productMicroservice: IFunction;
  basketMicroservice: IFunction;
  orderingMicroservice: IFunction;
}

export class SwnApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: SwnApiGatewayProps) {
    super(scope, id);

    // Product api gateway
    this.createProductApi(props.productMicroservice);
    // Basket api gateway
    this.createBasketApi(props.basketMicroservice);
    // Order api gateway
    this.createOrderApi(props.orderingMicroservice);
  }

  createProductApi(productMicroservice: IFunction) {
    // Product microservices api gateway
    // root name = product

    // GET /product
    // POST /product

    // Single product with id parameter
    // GET /product/{id}
    // PUT /product/{id}
    // DELETE /product/{id}
    const apigw = new LambdaRestApi(this, 'productApi', {
      restApiName: 'Product Service',
      handler: productMicroservice,
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

    return singleProduct;
  }

  createBasketApi(basketMicroservice: IFunction) {
    // Basket microservices api gateway
    // root name = basket

    // GET /basket
    // POST /basket

    // Single basket with userName parameter
    // GET /basket/{userName}
    // DELETE /basket/{userName}

    // checkout basket async flow
    // POST /basket/checkout

    const apigw = new LambdaRestApi(this, 'basketApi', {
      restApiName: 'Basket Service',
      handler: basketMicroservice,
      proxy: false,
    });

    const basket = apigw.root.addResource('basket');
    basket.addMethod('GET'); // GET /basket
    basket.addMethod('POST'); // POST /basket

    const singleBasket = basket.addResource('{userName}');
    singleBasket.addMethod('GET'); // GET /basket/{userName}
    singleBasket.addMethod('DELETE'); // DELETE /basket/{userName}

    const basketCheckout = basket.addResource('checkout');
    basketCheckout.addMethod('POST'); // POST /basket/checkout
    // expected request payload : { userName : swn }
  }

  createOrderApi(orderingMicroservice: IFunction) {
    // Ordering microservices api gateway
    // root name = order
    // GET /order
    // GET /order/{userName}
    // expectedrequest: xxx/order/swn?orderDate=timestamp
    // ording ms graph input and query parameters and filter to DynamoDB

    const apigw = new LambdaRestApi(this, 'orderApi', {
      restApiName: 'Order Service',
      handler: orderingMicroservice,
      proxy: false,
    });

    const order = apigw.root.addResource('order');
    order.addMethod('GET'); // GET /order

    const singleOrder = order.addResource('{userName}');
    singleOrder.addMethod('GET'); // GET /order/{userName}
    // expectedrequest: xxx/order/swn?orderDate=timestamp
    // ording ms graph input and query parameters and filter to DynamoDB
    return singleOrder;
  }
}
