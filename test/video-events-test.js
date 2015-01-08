var dotenv = require('dotenv');
var Firebase = require('firebase');
var assert = require("assert");
var VideoEvents = require('../index');

dotenv.load();

// This function is boilerplate for replicating how Amazon Kinesis events are
// passed to Lambda for processing.
//
// payloadString - The String to package
//
// Returns an Object as the data would be passed to Lambda
function packageEvent(payloadString) {
  var encodedPayload = new Buffer(payloadString).toString('base64')
  return {
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
}

// This object is boilerplate for the context passed to an Amazon Lambda
// function. Calling done() exits the process Lambda creates.
var context = {
  done: function(error, message) {
    console.log('done!');
    process.exit(1);
  }
};

// This function mimics how our upstream code (in this case, the Flask beacon)
// pipes video events to Kinesis.
//
// campaignId - An Integer id for the campaign being viewed
// eventName - A String for the name of the event being recorded
//
// Returns a String containing the data as passed to Kinesis
function generateEvent(campaignId, eventName) {
  var analyticsId = '123-' + campaignId + '-456';
  var properties = {
    ip: '79.104.4.85',
    mp_lib: 'as3',
    clip: 'konets-f8gr',
    referrer: 'https://play.adventr.tv/video-9-76005686',
    viewId: 'CENYr73adwDEd55MyrmTrmjK2QEDpUAe',
    http_referrer: 'https://play.adventr.tv/embed.html?source=ochre-play&load=0&poster=//d252srr1zuysk4.cloudfront.net/clients/43126710716529437798-2004/4575/thumbnails/1-i5nd_poster_0000.png&width=352&height=288&x=http://static.theochre.com/clients/43126710716529437798-2004/4575/published/43126710716529437798-2004-video-9-76005686.data',
    analyticsId: analyticsId,
    flashVersion: 'MAC 16,0,0,235',
    token: 'ochre-vpaid',
    distinct_id: '6886A9F3-680C-FD5C-41BC-CB4F4E17F6F0',
    Video: 'Video 9',
    time: '1419097235',
    swfUrl: 'https://d252srr1zuysk4.cloudfront.net/advntr/AdvntrPlayer.swf',
    duration: 405,
    pageUrl: 'https://d252srr1zuysk4.cloudfront.net/advntr/AdvntrPlayer.swf',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.78.2 (KHTML, like Gecko) Version/7.0.6 Safari/537.78.2'
  };
  var rawPayload = {
    event_id: '2014-12-20:35',
    event_date: '2014-12-20',
    event: eventName,
    event_time: '1419097235_YX4',
    properties: JSON.stringify(properties)
  };
  return JSON.stringify(rawPayload);
}

// Copied from index.js (for now)
function getFirebaseRef() {
  var prodFirebaseUrl = 'https://luminous-heat-2841.firebaseio.com/';
  var firebaseUrl = process.env.FIREBASE_URL || prodFirebaseUrl;
  return new Firebase(firebaseUrl + 'project/');
};

// Yes, random numbers are a red flag for non-deterministic tests, but in
// this case we are using them as unique IDs for projects. Not too flagrant
// a violation given that we are removing the child after each test.
function getUniqueId() {
  return Math.floor(Math.random()*1000000000);
}

describe('VideoEvents', function(){
  var projectRef = getFirebaseRef();
  var testId = getUniqueId();

  describe('Video View', function(){
    var eventName = 'Video View';

    before(function(done) {
      projectRef
        .child(testId)
        .child('events/' + eventName)
        .set(100, done);
    })

    after(function(done) {
      projectRef
        .child(testId)
        .remove(done);
    })

    it('should increment the video view event value', function(done){

      var testObject = packageEvent(generateEvent(testId, eventName));
      var testContext = {
        done: function(error, message) {
          projectRef
            .child(testId)
            .child('events/' + eventName)
            .once("value", function(snapshot) {
              assert.equal(101, snapshot.val());
              done();
            });
        }
      };

      VideoEvents.handler(testObject, testContext);

    })
  })
})
