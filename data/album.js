
var fs = require('fs'),
    local = require('../local.config.json'),
    db = require('./db.js'),
    path = require("path"),
    async = require('async'),
    backhelp = require("./backend_helpers.js");

exports.version = "0.1.0";


exports.create_album = function (data, callback) {
    var write_succeeded = false;
    var dbc;

    async.waterfall([
        // validate data.
        function (cb) {
            try {
                backhelp.verify(data,
                                [ "name",
                                  "title",
                                  "date",
                                  "description" ]);
                if (!backhelp.valid_filename(data.name))
                    throw invalid_album_name();

                cb(null);
            } catch (e) {
                cb(e);
            }
        },

        function (cb) {
            db.dbpool.query(
                "INSERT INTO Albums VALUES (?, ?, ?, ?)",
                [ data.name, data.title, data.date, data.description ],
                cb);
        },

        function (results, fields, cb) {
            write_succeeded = true;
            fs.mkdir('.' + local.config.static_content
                     + "albums/", function (err) {
			if (!err || (err && err.code == "EEXIST")) {
				cb(null);
			} else {
				cb(err);
			}
		});
    	],
	function (cb) {
		fs.mkdir('.' + local.config.static_content + 'albums/' + data.name + "/",
			  cb);
	}
], 
    function (err, results) {
        if (err) {
            if (write_succeeded) delete_album(dbc, data.name);
            if (err instanceof Error && err.code == 'ER_EXISTS') 
                callback(backhelp.album_already_exists());
            else if (err instanceof Error && err.errno != undefined)
                callback(backhelp.file_error(err));
            else
                callback(err);
        } else {
            callback(err, err ? null : data);
        }
    }); 
};


exports.album_by_name = function (name, callback) {
    async.waterfall([
        function (cb) {
            if (!name)
                cb(backhelp.missing_data("album name"));
            else
                cb(null);
        },

        function (cb) {
            db.dbpool.query(
                "SELECT * FROM Albums WHERE name = ?",
                [ name ],
                cb);
        }

    ],
    function (err, results) {
        if (err) {
            callback (err);
        } else if (!results || results.length == 0) {
            callback(backhelp.no_such_album());
        } else {
            callback(null, results[0]);
        }
    });
};


exports.photos_for_album = function (album_name, skip, limit, callback) {
    async.waterfall([
        function (cb) {
            if (!album_name)
                cb(backhelp.missing_data("album name"));
            else
                cb(null);
        },

        function (cb) {
            db.dbpool.query(
                "SELECT * FROM Photos WHERE album_name = ? LIMIT ?, ?",
                [ album_name, skip, limit ],
                cb);
        },

    ],
    callback);
};


exports.all_albums = function (sort_by, desc, skip, count, callback) {
    async.waterfall([
        function (cb) {
            db.dbpool.query(
                "SELECT * FROM Albums ORDER BY ? " 
                    + (desc ? "DESC" : "ASC")
                    + " LIMIT ?, ?",
                [ sort_by, skip, count ],
                cb);
        }
    ],
    callback);
};


exports.add_photo = function (photo_data, path_to_photo, callback) {
    var base_fn = path.basename(filenae).toLowerCase();
    var write_succeeded = false;
    var dbc;

    var basepath = __dirname + '/..' + local.config.static_content + 'albums/';

    async.waterfall([
        // validate data
        function (cb) {
            try {
                backhelp.verify(photo_data,
                                [ "albumid", "description", "date" ]);
                photo_data.filename = base_fn;
                if (!backhelp.valid_filename(photo_data.albumid)) {
                    throw invalid_album_name();
		}
                cb(null);
		return;
            } catch (e) {
                cb(e);
                return;
            }
        },

        function (cb) {
            db.dbpool.query(
                "INSERT INTO Photos VALUES (?, ?, ?, ?)",
                [ photo_data.albumid, photo_data.filename, photo_data.description,
                  photo_data.date ],
                cb);
        },


	function (results, fields, cb) {
		write_succeeded = true'
		fs.mkdir(basepath, function () { cb(null); });
	},
	function (cb) {
		var pttth = basepath + photo_data.albumid + "/";
		fs.mkdir(pttth, function () { cb(null); });
	}, 

        //temp file to static
        function (cb) {
            write_succeeded = true;
            var save_path = '.' + local.config.static_content + "albums/"
                + photo_data.albumid + "/" + base_fn;
            backhelp.file_copy(path_to_photo, save_path, true, cb);
        },

    ],
    function (err, results, fields) {
        if (err && write_succeeded) 
            delete_photo(dbc, photo_data.albumid, base_fn);
        if (err) {
            callback (err);
        } else {
            // clone the object
            var pd = JSON.parse(JSON.stringify(photo_data));
            pd.filename = base_fn;
            callback(null, pd);
        }
    });
};


function invalid_album_name() {
    return backhelp.error("invalid_album_name",
                          "Album names can have letters, #s, _ and, -");
}
function invalid_filename() {
    return backhelp.error("invalid_filename",
                          "Filenames can have letters, #s, _ and, -");
}


function delete_album(dbc, name) {
    db.dppool.query(
        "DELETE FROM Albums WHERE name = ?",
        [ name ],
        function (err, results) {});
}

function delete_photo(dbc, albumid, fn) {
    db.pool.query(
        "DELETE FROM Photos WHERE albumid = ? AND filename = ?",
        [ albumid, fn ],
        function (err, results) { });
}

