// company name swn
import { RemovalPolicy } from 'aws-cdk-lib';
import {
  Table,
  AttributeType,
  BillingMode,
  ITable,
} from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class SwnDatabase extends Construct {
  // expose product table
  public readonly productTable: ITable;

  //constructor requires two parameters
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // product dynamodb creation
    const productTable = new Table(this, 'product', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'product',
      // it will destroy table when destory cdk is executed
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // product expose
    this.productTable = productTable;
  }
}
