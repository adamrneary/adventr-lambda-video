var dotenv = require('dotenv');
var VideoEvents = require('../src/video-events');

dotenv.load();

var rawPayload = {
  projectId: 16,
  eventName: 'videoView'
};
var encodedPayload = new Buffer(JSON.stringify(rawPayload)).toString('base64')
var event = {
  "Records": [{
    "kinesis": {
      "partitionKey": "partitionKey-3",
      "kinesisSchemaVersion": "1.0",
      "data": encodedPayload,
      "sequenceNumber": "49545115243490985018280067714973144582180062593244200961"
    },
    "eventSource": "aws:kinesis",
    "eventID": "shardId-000000000000:49545115243490985018280067714973144582180062593244200961",
    "invokeIdentityArn": "arn:aws:iam::059493405231:role/testLEBRole",
    "eventVersion": "1.0",
    "eventName": "aws:kinesis:record",
    "eventSourceARN": "arn:aws:kinesis:us-east-1:35667example:stream/examplestream",
    "awsRegion": "us-east-1"
  }]
};

var context = {
  done: function(error, message) {
    console.log('done!');
    process.exit(1);
  }
};

VideoEvents.handler(event, context);
