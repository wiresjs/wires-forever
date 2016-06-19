var Forever = require('./index.js');
Forever.daemon('app.js', {
   name: 'my-test',
   logs: __dirname + "/.logs/",
   env: {
      NODE_ENV: "production"
   }
});
