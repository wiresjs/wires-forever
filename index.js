var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fork = require('child_process').fork;
var logger = require('log4js').getLogger('forever');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs')
var moment = require('moment');
var Promise = require('promise')

function getUserHome() {
   return process.env.HOME || process.env.USERPROFILE;
}

var getConfig = function(name) {
   var home = getUserHome();
   var configFolder = path.join(home, '.daemons_pids');
   mkdirp.sync(configFolder);
   var fname = name + ".pid";
   var targetInfoFile = path.join(configFolder, fname)

   return {
      getPID: function() {
         if (fs.existsSync(targetInfoFile)) {
            return fs.readFileSync(targetInfoFile).toString();
         }
      },
      setPID: function(id) {
         fs.writeFileSync(targetInfoFile, id)
      }
   }
}

var spawnProcess = function(pName, opts, logs, specialEnv) {
   var LOCAL_ENV = process.env;
   specialEnv = specialEnv || {};
   for (key in specialEnv) {
      LOCAL_ENV[key] = specialEnv[key];
   }
   var ps = spawn(pName, opts, {
      stdio: ['ignore', logs.out, logs.err],
      detached: true,
      env: LOCAL_ENV
   });
   return ps;
}

var rotateLogs = function(out, err, folder) {
   folder = path.join(folder, "archive", moment().format('MMMM-Do-YYYY'));
   mkdirp.sync(folder);

   if (fs.existsSync(out)) {
      var newFileName = "logs-" + moment().format('HH-mm-ss') + ".txt";

      var fullPath = path.join(folder, newFileName);
      fs.renameSync(out, fullPath);
   }
   if (fs.existsSync(err)) {
      var newFileName = "error-" + moment().format('HH-mm-ss') + ".txt";
      var fullPath = path.join(folder, newFileName);
      fs.renameSync(err, fullPath);
   }
}

var Forever = {
   path: 'forever',
   killByPid: function(pid) {
      return new Promise(function(resolve, reject) {
         logger.info("Killing process " + pid);
         exec("kill " + pid, {}, function(error, stdout, stderr) {
            return resolve();
         });
      });
   },
   promisify: function() {
      return new Promise(function(resolve, reject) {
         return resolve();
      });
   },
   checkPortAlive: function(opts) {
      var port = opts.port;

      var self = this;
      logger.info("Waiting for alive port " + port);
      var maxAttempts = opts.attempts || 5;
      var attempt = 0;
      return new Promise(function(resolve, reject) {
         var check = function() {
            logger.info("Checkig if port is alive - %s", attempt);
            if (attempt === maxAttempts) {
               return reject({
                  message: "The app did not launch after " + attempt + " attempts"
               })
            }

            return self.findPidByPort(port).then(function(pid) {
               if (pid) {
                  logger.info("The app seems to be running on port %s with pid (%s)", port, pid);
                  return resolve();
               } else {
                  attempt++;
                  setTimeout(function() {
                     check();
                  }, 1000);
               }
            });
         }
         return check();
      });

   },
   findPidByPort: function(port) {
      return new Promise(function(resolve, reject) {
         exec("lsof -ti :" + port, {}, function(error, stdout, stderr) {
            var processID = stdout * 1;
            if (processID > 0) {
               logger.info("Pid found " + processID);
               return resolve(processID);
            } else {
               return resolve();
            }
         });
      });
   },
   prepareLogs: function(opts) {
      var name = opts.name;

      var logsFolder = opts.logs || "/var/log/forever";
      var projectLogs = path.join(logsFolder, name);
      mkdirp.sync(projectLogs);
      var outFile = path.join(projectLogs, "logs.txt");
      var errFile = path.join(projectLogs, "error.txt");
      rotateLogs(outFile, errFile, projectLogs);
      var err = fs.openSync(errFile, 'a');
      var out = fs.openSync(outFile, 'a');
      return {
         folder: projectLogs,
         err: err,
         out: out
      }
   },
   killApp: function(opts, config) {
      var self = this;
      return this.promisify().then(function() {
         if (opts.port) {
            logger.info("Trying to kill by port " + opts.port);
            return self.findPidByPort(opts.port);
         } else {
            logger.info("Trying fetch config file ");
            return config.getPID();
         }
      }).then(function(pid) {
         if (pid) {
            return self.killByPid(pid)
         } else {
            logger.info("Nothing to kill. Launch");
         }
      });
   },
   daemon: function(file, opts) {
      var self = this;
      var name = opts.name;

      var env = opts.env || {};
      var nodeVersion = opts.nodeVersion;
      var config = getConfig(name);
      return this.killApp(opts, config).then(function() {
         var logs = self.prepareLogs(opts);
         logger.info("Logs folder %s", logs.folder);
         logger.info("Launching default node");
         if (nodeVersion) {
            logger.info("Launching on node %s", nodeVersion);
            var ps = spawnProcess("n", ["use", nodeVersion, file], logs, env);
         } else {
            logger.info("Launching default node");
            var ps = spawnProcess("node", [file], logs, env);
         }
         if (ps && ps.pid) {
            config.setPID(ps.pid);
            ps.unref();
         }
         return opts.port;
      }).then(function(port) {
         if (port) {
            return self.checkPortAlive(opts);
         }

      }).then(function() {
         logger.info("Live!");
      }).catch(function(e) {
         console.error(e.stack || e);
      });
   }
}

module.exports = Forever;
