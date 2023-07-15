// business code
exports.handler = async function (event) {
    console.log('request:', JSON.stringify(event, undefined, 2));

    // TODO: Catch and Process Async EventBride Inovcation and Sync API Gateway Invocation

    const eventType = event['detail-type'];
    if (eventType !== undefined) {
        // Event Bridge Invocation
        await eventBridgeInvocation(event);
    } else {
        // API Gateway Invocation -> sync response
        return await apiGatewayInvocation(event);
    }
}

const eventBridgeInvocation = async (event) => {
    const basket = event.detail;
}

const apiGatewayInvocation = async (event) => {

}