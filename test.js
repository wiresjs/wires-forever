var Forever = require('./index.js');
Forever.daemon(__dirname + '/app.js', {
   autostart: __filename,
   name: 'my-test',
   port: 3000,
   nodeVersion: "4.2.0",
   attempts: 5,
   logs: __dirname + "/logs/",
   env: {
      nodeVersion: "4.2.0",
      NODE_ENV: "production"
   }
});
