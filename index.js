/**
 * app.js
 */

var _ = require("underscore")

var fs = require("fs")

var parser = require("parse-torrent-file")

var fsScaner = require("scan-fs").create()

var path = require("path")

var copy = require("copy-file")

var exists = require("file-exists")

var makedirUtil = require("makedir").makedir

var Args = require('arg-parser')

var faker = require('./src/faker')


////////////////////////////////////////////
//
// Define the arguments
//
/////////////////////////////////////////////
var args = new Args('ArgParserTester', '1.0', 'NodeJS arg-parser module tester',
        'In addition to these parameters - more info here...')
args.add({ name: 'src', desc: 'Source folder', switches: [ '-s'], value: 'src' });
args.add({ name: 'dest', desc: 'output file', switches: [ '-d'], value: 'dest' });

if (args.parse()) console.log(args.params);

var defaults = {
	/**
	 * The base dir of torrent files.
	 */
	torrent_dir: function() { 
		var dir = __dirname + path.sep + "torrent" 
		if (!exists(dir)) {
			mkdir(dir)
		}
		return dir
	}(),

	/**
	 * The dest dir of the torrent files after cleaning.
	 */
	dest_dir:  function() { 
		var dir = __dirname + path.sep + "dest" 
		if (!exists(dir)) {
			mkdir(dir)
		}
		return dir
	}(),

	/**
	 * The success dir of the torrent files after cleaning.
	 */
	success_dir:  function() { 
		var dir = __dirname + path.sep + "success" 
		if (!exists(dir)) {
			mkdir(dir)
		}
		return dir
	}(),

	/**
	 * The dir for saving failures.
	 */
	 fail_dir: function() { 
		var dir = __dirname + path.sep + "fail" 
		if (!exists(dir)) {
			mkdir(dir)
		}
		return dir
	}(),
}


// Utility to make directory
function mkdir(dir) {
	makedirUtil(dir, function(err) {
		if(err) throw new Error (err)
	})
}

///////////////////////////////////////////
//
// First of all, we scan all of the torrent
// files in the torrent_dir.
// 
///////////////////////////////////////////

fsScaner

//////////////////////////////////////////
//
// Add listeners to 'file' event.
// 
////////////////////////////////////////// 
.listeners({
	file: function(filePath, eOpts) {
		if (isTorrent(filePath)) {
			doClean(filePath)
		}
	}
})

// Recursive to scan files.
.setRecursive(true)

// Do scan
.scan(defaults.torrent_dir)


/**
 * Clean the torrent file.
 */
function doClean(filePath) {


	///////////////////////////////
	// Read the file's data.
	///////////////////////////////
	fs.readFile(filePath, function(err, data){
		if (err) {
			console.log("Read file failed: " + filePath)
		}

		// Parse the data
		var parsed = parser(data)
		
		// Clean the parsed data
		clean(parsed)

		// New path for the target file
		var fileName = path.basename(filePath)
		var newpath = defaults.dest_dir + path.sep + fileName

		// Write data
		fs.writeFile(newpath, parser.encode(parsed), function(err){
			if (err) {

				console.log("Failed to deal file: " + filePath)

				// Copy the fails to fail path
				var failPath = defaults.fail_dir + path.sep + fileName
				copy(filePath, failPath)
				throw err
			} else {
				// Copy the success to success path
				// var successPath = defaults.success_dir + path.sep + fileName

				fs.unlinkSync(filePath)
				// fs.renameSync(filePath, successPath)
			}
		})
	})
}

/**
 * Test the filePath is a torrent file.
 * 
 * @returns true if the file path is a torrent 
 *           file, otherwise returns false
 *          
 */
function isTorrent(filePath) {
	return '.torrent' === path.extname(filePath)
}

function parseExtname(filename) {
	var extname = path.extname(filename)
	var isValidExtname = /^\.[a-zA-Z0-9]+$/.test(extname)
	if (!isValidExtname) {
		extname = ''
	}
	return extname
}

var cleaner = {
 	// for single file
 	single: function single(parsed) {
	 	var info = parsed.info
	 	// Get the extname of current file.
	 	var extname = parseExtname(parsed.name)
	 	// Fake the basename of current file
	 	var basename = faker(path.basename(parsed.name, extname))
	 	// Generate a new for the file
	 	var newname = basename + extname

	 	info.name = info['name.utf-8'] = new Buffer(newname)

	 	return parsed
 	},

 	// for multiple files
 	multiple: function multiple(parsed) {
 		var info = parsed.info
 		var files = parsed.files
 		var basedir = faker(parsed.name)

 		// Fake base directory
 		info.name = info['name.utf-8'] = new Buffer(basedir)

 		_.forEach(files, function(file, i) {
	 		// Get the extname of current file.
	 		var extname = parseExtname(file.name)
	 		var basename = faker(path.basename(file.name, extname))
	 		// Generate a new name for current file
	 		var newname = basename + extname

			info.files[i].path = info.files[i]['path.utf-8'] = [ new Buffer(newname) ]
 		})

 		return parsed
 	}
}


/**
 * Clean data
 */
 function clean(parsed) {
 	if (parsed.files.length > 1) {
 		return cleaner.multiple(parsed)
 	} else {
 		return cleaner.single(parsed)
 	}
 }

 function print(parsed) {
 	console.log(parsed)

 	if (parsed.info.files) {
 		_.forEach(parsed.info.files, function(file) {
 			console.log(file)

 			var path = ""
 			_.forEach(file.path, function(pathSeg){
 				path += pathSeg.toString('utf-8')
 			})
 			console.log(path)
 		})
 	}
 }
