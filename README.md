# wires-forever

A simple script to launch apps in the background

I got fed up with manual work, and created a simple and automated script that calls "forever" with daemon mode.

```js
var Forever = require('wires-forever');

Forever.daemon(__dirname + '/app.js', {
   autostart: __filename, // will automatically generate auto start script (check logs)
   name: 'my-test',
   port : 3000, // recommended
   noveVersion : "0.12.0" // optional - "n" must be installed
   logs: __dirname + "/.logs/",
   env: {
      NODE_ENV: "production"
   }
});
```

You launch this script and you can be sure that your application is running.
