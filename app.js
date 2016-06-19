var express = require('express');
var app = express();

console.log(process.env);
app.listen(3000, function() {
   console.log('Example app listening on port 3000!');
});
