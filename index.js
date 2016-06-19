var exec = require('child_process').exec;
var logger = require('log4js').getLogger('forever');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs')
var moment = require('moment');

var callScript = function(cmd, cb, specialEnv) {
   var LOCAL_ENV = process.env;
   for (key in specialEnv) {
      LOCAL_ENV[key] = specialEnv[key];
   }
   var node = exec(cmd, {
      env: LOCAL_ENV
   }, function(error, stdout, stderr) {
      if (stderr) {
         cb(stderr, null);
      } else {
         cb(null, stdout)
      }
   });
}

var rotateLogs = function(a, folder) {
   if (fs.existsSync(a)) {
      var newFileName = moment().format('MMMM-Do-YYYY-HH-mm-ss') + ".txt";
      var fullPath = path.join(folder, newFileName);
      fs.renameSync(a, fullPath);
   }
}

// forever start -o logs.text --uid test-app app.js
var Forever = {
   path: 'forever',
   stop: function(name, cb) {
      callScript('forever stop ' + name, cb);
   },

   daemon: function(file, opts) {

      var name = opts.name;
      var spinSleepTime = opts.spinSleepTime || 5000;
      var minUptime = opts.minUptime || 5000;
      var env = opts.env || {};

      var logsFolder = opts.logs || "/var/log/forever";
      var projectLogs = path.join(logsFolder, name);
      var logsFile = projectLogs + "/logs.txt";

      mkdirp.sync(projectLogs)

      rotateLogs(logsFile, projectLogs);

      logger.info("Preparing '%s' daemon", name);
      logger.info("Stopping existing '%s' if running", name);
      logger.info("Logs folder %s", projectLogs);

      this.stop(name, function(error) {
         if (!error) {
            logger.info("Daemon has been stopped");
         } else {
            logger.info("Daemon is not launched");
         }

         var env = opts.env || {};

         var data = [
            'forever', 'start',
            '--spinSleepTime', spinSleepTime,
            '--minUptime', minUptime,
            '-l', logsFile,
            '--uid', name,
            file
         ];
         var cmd = data.join(' ');
         logger.info("Launching...")
         logger.info(cmd);
         callScript(cmd, function(error, out) {
            if (error) {
               logger.fatal(error);
            } else {
               logger.info("%s has been successfully started", name)
               logger.info(out);
            }
         }, env);
      });
   }
}

module.exports = Forever;
