import { EventBridgeClient } from '@aws-sdk/client-eventbridge';

// create an amazon event bridge client object
export const ebClient = new EventBridgeClient();
