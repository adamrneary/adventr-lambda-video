var kinesis = require('kinesis');
Transform = require('stream').Transform;
fs = require('fs');

// Data is retrieved as Record objects, so we transform into Buffers.
var bufferify = new Transform({objectMode: true})
bufferify._transform = function(record, encoding, cb) {
  cb(null, record.Data)
}
readStream = kinesis.stream({name: 'video-events'})
  .pipe(bufferify)

// We can we pipe to stdout and to a newline-separated flat file.
readStream.pipe(process.stdout);
writeStream = fs.createWriteStream('test/events.log');
readStream.on('data', function(chunk) {
  data = new Buffer(chunk, 'base64').toString('utf-8') + "\r\n";
  writeStream.write(data);
});
