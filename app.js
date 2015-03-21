/**
 * app.js
 */

var _ = require("underscore")

var fs = require("fs")

var parser = require("parse-torrent-file")

var fsScaner = require("scan-fs").create()

var path = require("path")

var faker = require("faker")

var copy = require("copy-file")

var exists = require("file-exists")

var makedirUtil = require("makedir").makedir

var Args = require('arg-parser')

var sparkWord = require('./spark_word')


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

// =========================================== \\
// facker
// =========================================== //
var FACKER_FACTOR = [
	String.fromCharCode(773) + String.fromCharCode(818), // transmute
	String.fromCharCode(816), // underline
	String.fromCharCode(1161), // Ass
	String.fromCharCode(822), // strikeout
];

function newFacker(str, factorIndex) {
	var i, j, factor, ret;

	factorIndex = factorIndex ? factorIndex : 0;
	factor = FACKER_FACTOR[factorIndex]; // 2386
    ret = '';

    str = str.replace(FACKER_FACTOR[0], '')
    		.replace(FACKER_FACTOR[1], '')
    		.replace(FACKER_FACTOR[2], '')
    		.replace(FACKER_FACTOR[3], '');

    str = sparkWord.string(str);

    for (i = 0, j = str.length; i < j; i++) {
        ret += str.charAt(i) + factor;
    }

    return ret;
}

// Utility to make directory
function mkdir(dir) {
	makedirUtil(dir, function(err) {
		if(err) throw new Error (err)
	})
}

//////////////////////////////////
//
// Set the locale of faker
//
//////////////////////////////////
faker.locale = "en_US"


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
				var successPath = defaults.success_dir + path.sep + fileName

				fs.unlinkSync(filePath)
				//fs.renameSync(filePath, successPath)
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


/**
 * Clean data
 */
 function clean(parsed) {

 	var basedir = parsed.name
 	var info = parsed.info
 	var files = parsed.files
 	var nameParsed = false

 	// print(parsed)

 	//info.name = info['name.utf-8'] = new Buffer(faker.name.findName()

 	_.forEach(files, function(file, i) {
 		// Get the extname of current file.
 		var ext = path.extname(file.name)

 		var basename = newFacker(path.basename(file.name, ext)).replace(/\./g, '')

 		// Generate a new for the file
 		var newName = basename + ext
 		
 		// Translate string to buffer.
 		var buf = new Buffer(newName)

 		if (parsed.name === file.name) {
 			info.name = info['name.utf-8'] = newName
 		}
		file.path = file.name = newName

 		// Save the new name to info.
 		// If there is only one file in the torrent, the name is the file name,
 		// otherwise, the file information are stored in info.files.
 		if (!nameParsed) {

 			if (parsed.name === file.name) {
 				info.name = info['name.utf-8'] = buf
 			} else {
 				info.name = info['name.utf-8'] = new Buffer(newFacker(parsed.name))
 			}

 			nameParsed = true
 		}

 		// The index of file name in the paths array. 
		//var nI = info.files[i].path.length - 1
		if (info.files && info.files.length) {
			info.files[i].path = info.files[i]['path.utf-8'] = [buf]
		}
 	})

 	return parsed
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
