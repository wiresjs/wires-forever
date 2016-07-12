var express = require('express');
var app = express();

console.log(process.env);
setTimeout(function() {
   //console.error("dead..")
   //process.exit(1)
}, 500)
app.listen(3000, function() {
   console.log('Example app listening on port 3000!');
});
