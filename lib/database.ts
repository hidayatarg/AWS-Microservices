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
  // expose table
  public readonly productTable: ITable;
  public readonly basketTable: ITable;
  public readonly orderTable: ITable;

  //constructor requires two parameters
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // product table expose
    this.productTable = this.createProductTable();
    // basket table expose
    this.basketTable = this.createBasketTable();
    // order table expose
    this.orderTable = this.createOrderTable();
  }

  // product dynamodb creation
  // product: PK: id --name -description -imageFile -price -category
  // these are fields we can pass through post request (client)
  private createProductTable(): ITable {
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

    return productTable;
  }

  // basket dynamodb creation
  // basket: PK: username -basketItemList (SET-MAP object) (Nosql cannbe in same table in json)
  // item1 -> {quantity - color - price - productId - productName}
  // item2 -> {quantity - color - price - productId - productName}

  private createBasketTable(): ITable {
    const basketTable = new Table(this, 'basket', {
      partitionKey: {
        name: 'userName',
        type: AttributeType.STRING,
      },
      tableName: 'basket',
      // it will destroy table when destory cdk is executed
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    return basketTable;
  }

  // order dynamodb creation
  // order: PK: username - SK(sortkey): orderDate --totalPrice -firstName -lastname -email -address -paymentMethod -cardInfo (SET-MAP object) (Nosql cannbe in same table in json)
  private createOrderTable(): ITable {
    const orderTable = new Table(this, 'order', {
      partitionKey: {
        name: 'userName',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'orderDate',
        type: AttributeType.STRING,
      },
      tableName: 'order',
      // it will destroy table when destory cdk is executed
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    return orderTable;
  }
}
