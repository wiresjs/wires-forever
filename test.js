var Forever = require('./index.js');
Forever.daemon('app.js', {
   name: 'my-test',
   nodeVersion: "0.12.10",
   logs: __dirname + "/.logs/",
   env: {
      NODE_ENV: "production"
   }
});
