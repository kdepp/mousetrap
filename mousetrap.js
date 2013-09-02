
var loader = require('./fetch'),
	fs = require('fs'),
	_ = require('lodash'),
	mkdirp = require('mkdirp'),
	async = require('async'),
	mysql = require('mysql'),
	beautify = require('js-beautify').js_beautify;


var connection = mysql.createConnection({
	host     : '127.0.0.1',
	user     : 'root',
	password : '123123lu',
	database : 'mousetrap'
});

connection.connect();

/*
 * 抓取页面中的信息
 *
 * obj:
 * 		url		待抓取的地址
 * 		toCrawl	要抓取的内容
 *
 * callback		给Async.queue预留的回调
 *
 */
var grab = function (obj, callback) {
	var processResult = function (result) {
			//console.log(result);
			//fs.writeFile("./test.txt", beautify(JSON.stringify(result)));
			_(result).each(function (item) {
				//console.log(item.length);
			});
		},
		crawlFnByType = {
			basic: function ($, crawlItem, crawlingUrl) {
				
			}	   
			, basic_group: function ($, crawlItem, crawlingUrl) {

			}
			, link: function ($, crawlItem, crawlingUrl) {
				var $dom = $(crawlItem.selector),
					check = function (val) {
						return ("link" in val);
					},
					result = [];

				console.log("link function: " + $dom.length);

				_($dom).each(function (item, index) {
					var ret = crawlItem.fn.call(null, $(item), crawlingUrl);
					check(ret) && result.push(ret);
				});

				return result;
			}
			, link_group: function ($, crawlItem, crawlingUrl) {
				var $dom = $(crawlItem.selector),
					check = function (val) {
						if (!_.isArray(val))	return false;
						return _.every(val, function (item) {
							return ("link" in item);
						});
					},
					result = [],

				result = crawlItem.fn.call(null, $dom, crawlingUrl);
				if (check(result)) {
					return result;
				}

				return null;
			}
		};

	console.log("in grab: ");
	console.log(obj.url);

	loader.loadUrl(encodeURI(obj.url), function ($, loadCallback) {
		var result = {};

		_(obj.toCrawl).each(function (crawlItem, key) {
			if (crawlItem.type in crawlFnByType) {
				result[key] = {
					type: crawlItem.type
					, target: crawlItem.target
					, result: crawlFnByType[crawlItem.type].call(null, $, crawlItem, obj.url)
					, crawlingUrl: obj.url
					, levelId: obj.name
				};
			}	
		});	

		//loadCallback();
		processResult(result);
		callback && callback(result, obj);
	});	
};

var taskCenter = {
	_opt: {
		tidFileName: 'tid.txt'
		, levelFileName: 'level_list.txt'
		, listListFileName: 'list_list.txt'
		, taskFileQueueThreshold: 1
		, taskQueueThreshold: 20
		, persist: {
			file: true
			, db: true
		}
	}
	, _curLevelId : null
	, _curListId: null
	, _curTaskId: null

	, baseURI: './data'

	, initParam: function (cfg) {
		this.cfg = cfg;
		this.projectURI = this.makeURI(this.baseURI, cfg.projectName);
		this.roundURI = this.makeURI(this.projectURI, this.makeDateStr());
		this.taskDirURI = this.makeURI(this.roundURI, 'task');
		this.dataDirURI = this.makeURI(this.roundURI, 'data');
		this.taskListDirURI = this.makeURI(this.taskDirURI, 'list');
		this.rdbPrefix = cfg.projectName;
		this._curLevelId = 'unknown';
		this._curListId = '1';
		this._curTaskId = 'unknown';

	}
	, initLevel: function (cfg) {
		this.writeLevel(cfg.routes);	
	}
	, initTid: function () {
		this.writeTid({
			levelId: null
			, listId: null
			, taskId: null	
		});	
	}

	, initFirstTaskList: function (cfg) {
		var level = cfg.routes[0];
		this.appendTaskList(level.name, level.urlPattern);
		this._curLevelId = level.name;
		this.runLevel(level.name);
	}

	, initQueue: function () {
		this.taskListFileQueue = async.queue(_.bind(this.taskListFileWorker, this), this._opt.taskFileQueueThreshold);
		this.taskQueue = async.queue(_.bind(this.taskWorker, this), this._opt.taskQueueThreshold);
	}

	, initRDB: function () {
		var self = this;

		_.each(this.cfg.rdb, function (item, key) {
			self.createRDBTable(key);	
		});
	}

	, taskListFileWorker: function (taskFile, callback) {
		var self = this;


		var content = fs.readFileSync(taskFile.filePath, 'utf-8');
		var urls = _.filter(content.split("\n"), function (line) {
			return line.length && line.length > 0;
		});;
		console.log("in taskListFile Worker");
		console.log(urls);
		self.addTasksByUrlAndLevel(urls, taskFile.levelId, callback);
	}

	, taskWorker: function (task, callback) {
		console.log("in TaskWorker");

		var level = this.getLevel(task.name);
		var self = this,
			grabCallback = function (result, level) {
				// 将数据持久化
				// 将一部分url数据，重新加回
				var linkReg = /^link/,
					dataReg = /^basic/;

				//console.log(result);

				_.each(result, function (item, key) {
					if (linkReg.test(item.type)) {
						self.appendTaskList(item.target, _.map(item.result, function (obj) {
							return obj.link;
						}));
					} 

					self.persistData(item.target, item.crawlingUrl, item.result);
					self.writeTid({
						levelId: task.levelId
						, listId: 'shit'
						, taskId: task.crawlingUrl
					});

					// TODO: 更新tasklist里的完成情况
					// TODO: 多个task同时执行，需要用跟心tasklist中task状态的形式来记录当前运行情况
				});

				callback();	
			};

		console.log(task.name);
		task.url = level.urlPreprocess ? level.urlPreprocess.call(null, task.url) : task.url;

		console.log("task url: " + task.url);
		grab(task, grabCallback);
	}

	, addTasksByUrlAndLevel: function (urls, levelId, callback) {
		var level = this.getLevel(levelId),
			tasks;

		console.log("in addTasksByUrlAndLevel:");
		console.log(levelId);
		console.log(level);
		if (!level)	return false;
		
		tasks = _.map(urls, function (url) {
			return _.extend({}, level, {url: url});
		});

		this.addTasks(tasks, callback);
	}

	, addTasks: function (tasks, callback) {
		this.taskQueue.drain =  callback;
		this.taskQueue.push(tasks);	
		console.log("task total count: " + this.taskQueue.length());
	}

	, addFromTaskListFiles: function (files, callback) {
		this.taskListFileQueue.drain = callback;
		this.taskListFileQueue.push(files);
	}

	, makeDateStr: function () {
		var d = new Date();
		return [d.getFullYear(), '-', d.getMonth() + 1, '-', d.getDate(), '_', d.getHours(), d.getMinutes()].join('');
	}
	, makeURI: function () {
		return Array.prototype.slice.call(arguments, 0).join('/').replace(/\/+/g, '/');
	}
	, writeJSONFile: function (fileName, json) {
		fs.writeFile(fileName, beautify(JSON.stringify(json)));	
	}
	, writeLevel: function (json) {
		mkdirp.sync(this.taskDirURI);
		this.writeJSONFile(this.makeURI(this.taskDirURI, this._opt.levelFileName), json);
	}
	, writeListList: function (taskList, json) {
		mkdirp.sync(this.taskDirURI);
		this.writeJSONFile(this.makeURI(this.taskDirURI, this._opt.listListFileName), json);
	}
	, writeTid: function (json) {
		mkdirp.sync(this.taskDirURI);
		this.writeJSONFile(this.makeURI(this.taskDirURI, this._opt.tidFileName), json);
	}
	, writeTaskList: function (levelId, listId, json) {
		mkdirp.sync(this.makeURI(this.taskListDirURI, levelId));
		this.writeJSONFile(this.makeURI(this.taskListDirURI, listId), json);
	}
	, appendTaskList: function (levelId, url) {
		//console.log("################### in appendTaskList: ");
		//console.log(url);
		//console.log(levelId);
		//console.log(this.makeURI(this.taskListDirURI, levelId, this._curListId));
		mkdirp.sync(this.makeURI(this.taskListDirURI, levelId));
		fs.appendFileSync(this.makeURI(this.taskListDirURI, levelId, this._curListId), (_.isArray(url) ? url.join("\n") : url) + "\n");
	}

	, writeData: function (levelId, url, data) {
		var fileName = url.replace(/:/g, '').replace(/\/|\.|\?|=|&/g, '_'),
			dirPath = this.makeURI(this.dataDirURI, levelId),
			filePath = this.makeURI(this.dataDirURI, levelId, fileName);

		mkdirp.sync(dirPath);
		fs.writeFile(filePath, beautify(JSON.stringify(data)));	
	}

	, getTableName: function (name) {
		return this.rdbPrefix + '_' + name.replace(/-/g, '_');
	}

	, storeRDBTable: function (levelId, url, data) {
		var dbStruct = this.cfg.rdb[levelId],
			dataMatch = false,
			self = this;;

		
		console.log("prepare to store db, " + levelId);
		if (!dbStruct)	return;

		dataMatch = _.every(data[0], function (item, key) {
			if (dbStruct[key])	return true;
			return false;
		});

		if (!dataMatch)	return;


		console.log('INSERT INTO ' + this.getTableName(levelId) + ' SET ?');

		_.each(data, function (item) {
			item['create_time'] = item['update_time'] = new Date;
			connection.query('INSERT INTO ' + self.getTableName(levelId) + ' SET ?', item, function (err) {
				if (err) {
					console.log("some error");	
					console.log(err);
				}
			});
		});
	}

	, createRDBTable: function (levelId) {
		var	tableName, sql, 
			fieldSql = [],
			hasPrimaryKey = false;; 

		_.each(this.cfg.rdb[levelId], function (item, key) {
			if (key == '_extra') return;
			var field = [key, item.type, item._extra].join(' ');
			fieldSql.push(field);
			if (item._extra && item._extra.match(/primary/i))	hasPrimaryKey = true;
		});

		if (!hasPrimaryKey) {
			fieldSql.push('id BIGINT PRIMARY KEY AUTO_INCREMENT');
		}

		fieldSql.push('create_time DATETIME');
		fieldSql.push('update_time DATETIME');

		if (this.cfg.rdb[levelId]._extra) {
			fieldSql.push(this.cfg.rdb[levelId]._extra);
		}

		sql = [
			'CREATE TABLE IF NOT EXISTS ', this.getTableName(levelId), ' (',
			fieldSql.join(','),
			')'
		].join('');

		console.log(sql);
		connection.query(sql);
	}

	, persistData: function (levelId, url, data) {
		console.log("@@ persisting data...");
		this._opt.persist.file && this.writeData(levelId, url, data);
		this._opt.persist.db && this.storeRDBTable(levelId, url, data);
	}

	, getFileName: function (path) {
		var fileName = path;
		return fileName.replace(/^.*\//g, '');
	}

	, init: function (cfg) {
		this.initParam(cfg);
		this.initTid();
		this.initLevel(cfg);
		this.initRDB();
		this.initQueue();
		this.initFirstTaskList(cfg);
	}

	, runLevel: function (levelId, listId, taskId) {
		// 从某个Level的Task List (可能从某个断点开始）执行任务
		// Step 1, 执行该Level中的所有Task List
		// Step 2, 判断是否有下一级的Level需要执行
		if (!levelId)	return false;
		if (!listId)	listId = 1;

		console.log("$$$$$$$$$ going to run level: " + levelId);

		// 拿到TaskList列表
		var self = this;
		var dirPath = this.makeURI(this.taskListDirURI, levelId),
			files = _.reject(fs.readdirSync(dirPath), function (path) {
				return path == '.' || path == '..';	
			});

		_.sortBy(files, function (path) {
			var fileName = self.getFileName(path);
			return ~~fileName;
		});


		var taskListFiles = _.map(files, function (fileName) {
			return {
				filePath: self.makeURI(dirPath, fileName)
				, levelId: levelId
			};	
		});

		this.addFromTaskListFiles(taskListFiles, function () {
			console.log("### ready for next level ###");
			self.runNextLevel(levelId);		
		});
	}

	, runNextLevel: function (levelId) {
		var routes = this.cfg.routes,
			levelIndex = _.findIndex(routes, function (level) {
				return level.name == levelId;	
			});

		if (levelIndex <= -1)	return;
		if (levelIndex >= routes.length - 1) {
			console.log("the end of all levels");
			return;
		}

		this.runLevel(routes[levelIndex + 1].name);
	}

	, getLevel: function (levelId) {
		var levels = _.where(this.cfg.routes, {name: levelId});
		return levels ? levels[0] : null;
	}

};

//loader.loadUrl('http://www.xiachufang.com/category/40076/?page=10000', function () {});

exports.taskCenter = taskCenter;

