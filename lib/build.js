var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var Mocha = require('mocha');
var karmaServer = require('karma').server;

function exitOnFail(exitCode) {
  if(exitCode != 0) {
    process.exit(exitCode);
  }
}

function Build() {
}

Build.prototype.bundleDeps = function() {
  var browserify = require('browserify');
  var bundles = arguments;

	mkdirp('dist/mocha', function(err) {
		if(err) {
			console.error(err);
		}
		else {
			for(var bundleName in bundles) {
        var bundle = bundles[bundleName];
				var b = browserify();

				for(var key in bundle.inputFilePaths) {
          var inputFilePath = bundle.inputFilePaths[key];
					b.add(inputFilePath);
				}

				b.bundle().pipe(fs.createWriteStream(path.join('dist', bundle.outputFilePath)));
			}

			fs.createReadStream('node_modules/dchambers-lib-build-tool/node_modules/mocha/mocha.js').pipe(
        fs.createWriteStream('dist/mocha/mocha.js'));
			fs.createReadStream('node_modules/dchambers-lib-build-tool/node_modules/mocha/mocha.css').pipe(
        fs.createWriteStream('dist/mocha/mocha.css'));
		}
	});
};

Build.prototype.bundle = function(outputFilePath, inputFilePaths) {
	return {
		'inputFilePaths': inputFilePaths,
		'outputFilePath': outputFilePath
	};
};

Build.prototype.publish = function(packageJson) {
	var version = packageJson.version;
	var name = packageJson.name;

	console.log('You now need to run:');
	console.log('  git tag -a v' + version + ' -m "Tagged version ' + version + '."; git push origin v' + version);
	console.log('');
	console.log('Download the built artifact here:');
	console.log('  <http://registry.npmjs.org/' + name + '/-/' + name + '-' + version + '.tgz>');
	console.log('');
	console.log('Then edit the release notes here:');
	console.log('  <https://github.com/dchambers/' + name + '/releases>');
	console.log('');
};

Build.prototype.mochaTest = function(testTitle, sourceFiles) {
  return new Promise(function(resolve, reject) {
    var Mocha = require('mocha');
    var mocha = new Mocha();

    console.log(testTitle + ':');

    for(key in sourceFiles) {
      var sourceFile = sourceFiles[key];
      mocha.addFile(path.normalize(sourceFile));
    }

    mocha.run(function(exitCode) {
      if(exitCode == 0) {
        console.log('');
        resolve();
      }
      else {
        reject(exitCode);
      }
    });
  });
};

Build.prototype.karmaTest = function(testTitle, sourceFiles, browsers, autoRun) {
  var singleRun = (autoRun !== true);

  return new Promise(function(resolve, reject) {
    console.log(testTitle + ':');

    var files = [];
    for(var key in sourceFiles) {
      var sourceFile = sourceFiles[key];
      files.push(path.resolve(sourceFile));
    }

    karmaServer.start({
        configFile: path.resolve('node_modules/dchambers-lib-build-tool/karma-conf.js'),
        files:files,
        singleRun:singleRun,
        browsers:browsers
      },
      function(exitCode) {
        if(exitCode == 0) {
          console.log('');
          resolve();
        }
        else {
          reject(exitCode);
        }
      }
    );
  });
};

module.exports = new Build();
