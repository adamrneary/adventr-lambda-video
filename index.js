var Firebase = require('firebase');
var async = require('async');

// Extract data from the kinesis event
exports.handler = function(event, context) {

  // This function abstracts the expected structure of any Kinesis payload,
  // which is a base64-encoded string of a JSON object, passing the data to
  // a private function.
  function handlePayload(record, callback) {
    encodedPayload = record.kinesis.data;
    rawPayload = new Buffer(encodedPayload, 'base64').toString('utf-8');
    handleData(JSON.parse(rawPayload), callback);
  }

  // The Kinesis event may contain multiple records in a specific order.
  // Since our handlers are asynchronous, we handle each payload in series,
  // calling the parent handler's callback (context.done) upon completion.
  async.eachSeries(event.Records, handlePayload, context.done)
};

// This is just an intermediate function. The projectId is buried in an
// analyticsId of the format clientId-projectId-version. So the string split
// extracts the projectId.
function handleData(data, callback) {
  var projectRef = getProjectRef();
  var analyticsId = JSON.parse(data.properties).analyticsId;
  var projectId = analyticsId.split('-')[1]
  incrementProjectEvent(projectRef, projectId, data.event, callback);
};


// Lambda does not have access to environment variables, so we hardcode the
// production db URL into the codebase (this is non-sensitive) but override
// with local environment variables for development and test.
function getProjectRef() {
  var prodFirebaseUrl = 'https://luminous-heat-2841.firebaseio.com/';
  var firebaseUrl = process.env.FIREBASE_URL || prodFirebaseUrl;
  return new Firebase(firebaseUrl + 'project/');
};

// Incrementing a value is an atomic operation, meaning that you need to know
// the current value in order to add to it, and multiple set operations cannot
// be executed at the same time. Firebase provides for this using transactions.
//
// As long as the callback is executed on completion of the transaction, you
// are in good shape.
function incrementProjectEvent(projectRef, projectId, eventName, callback) {
  projectRef
    .child(projectId)
    .child('events/' + eventName)
    .transaction(function(currentData) {
      if (currentData === null) {
        return 1;
      } else {
        return currentData + 1;
      }
    }, function(error, committed, snapshot) {
      if (error) {
        console.log('Transaction failed abnormally!', error);
      }
      callback();
    });
};
