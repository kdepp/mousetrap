
//var jsdom = require("./node_modules/jsdom");
///var iconv = require('../node_modules/iconv');
var cheerio = require("./node_modules/cheerio"),
	request = require('./node_modules/request'),
	fs = require("fs"),
	url = require('url'),
	http = require('http'),
	exec = require('child_process').exec;

var loadUrl = function (url, callback) {
	request({uri: url}, function(error, response, body) {
		var $ = cheerio.load(body);
		callback.call(null, $, function () {
			window.close();
		});
	});

	/*
    jsdom.env(
		url, 
		[ 'http://libs.baidu.com/jquery/1.9.0/jquery.js' ], 
		function(errors, window) {
			var $ = window.jQuery;

			callback.call(null, $, function () {
				window.close();
			});
		}
	);
	*/
};

var loadUrlNeedEncoding = function (url, from, to, callback) {
    request({uri: url, encoding: 'binary'},
        function(error, response, body) {
            body = new Buffer(body, 'binary');
            conv = new iconv.Iconv(from, to);
            body = conv.convert(body).toString();

            jsdom.env({
                html: body,
                // src: [fs.readFileSync('./jquery.min.js').toString()],
                scripts: ['http://code.jquery.com/jquery-1.5.min.js'],
                done: function(error, window) {
                    var $ = window.jQuery;
                    callback.call(null, $, function () {
                        window.close();
                    });
                }
            });
        }
    );
};

var absUrl = function (baseUrl, relUrl) {
    if (! /^http/.test(relUrl)) {
        if (/^\//.test(relUrl)) {
            var a = url.parse(baseUrl),
                domain = [a.protocol, a.hostname].join("//");
            return domain + relUrl;
        } else {
            baseUrl = baseUrl.replace(/\/?$/, "/");
            return baseUrl + relUrl;
        }
    } else {
        return relUrl;
    }
};

// Function to download file using HTTP.get
var download_file_httpget = function(file_url, downloadDir, callback) {
    var options = {
        host: url.parse(file_url).host,
        port: 80,
        path: url.parse(file_url).pathname
    };

    var file_name = url.parse(file_url).pathname.split('/').pop();
    var file = fs.createWriteStream(downloadDir + file_name);

    http.get(options, function(res) {
        res.on('data', function(data) {
                file.write(data);
            }).on('end', function() {
                file.end();
                callback.call();

                console.log(file_name + ' downloaded to ' + downloadDir);
            });
    });
};


var wget = function (file_url, downloadDir, callback) {
    exec(["wget -P", downloadDir, file_url].join(" "), function () {
        callback.call();
    });
};


var log = function (text, file, append) {
    var text = text + "\n";

    if (append) {
        fs.open(file, "a", 0644, function (err, fd) {
            if (err)    throw err;
            fs.writeSync(fd, text);
            fs.closeSync(fd);
        });
    } else {
        fs.writeFile(file, text, function (err) {
            if (err)    throw err;
        });
    }
};

exports.loadUrl = loadUrl;
exports.loadUrlNeedEncoding = loadUrlNeedEncoding;
exports.downloadFile = download_file_httpget;
exports.wget = wget;
exports.absUrl = absUrl;
exports.log = log;

