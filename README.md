# wires-forever

A simple script on top of forever daemon.

I got fed up with manual work, and created a simple and automated script that calls "forever" with daemon mode.

```js
var Forever = require('wires-forever');

Forever.daemon(__dirname + '/app.js', {
   name: 'my-test',
   logs: __dirname + "/.logs/",
   env: {
      NODE_ENV: "production"
   }
});
```

You launch this script and you can be sure that your application is running. The script simply passes parameters to forever

```bash
[INFO] forever - Preparing 'my-test' daemon
[INFO] forever - Stopping existing 'my-test' if running
[INFO] forever - Logs folder ./wires-forever/.logs/my-test
[INFO] forever - Daemon has been stopped
[INFO] forever - Launching...
[INFO] forever - forever start --spinSleepTime 5000 --minUptime 5000 -l /.logs/my-test/logs.txt --uid my-test app.js
[INFO] forever - my-test has been successfully started
[INFO] forever - info:    Forever processing file: app.js
```

Forever has to be installed on your system.
Simple and elegant solution to launching your apps on external server. Before launching, script kills existing process 
(to ensure proper restart).

