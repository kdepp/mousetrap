var exportXlsx = require("../mysql_to_xlsx"),
	path = require("path");

exportXlsx.mysql_to_xlsx({
	host     : '127.0.0.1',
	user     : 'root',
	password : '123123lu',
	database : 'mousetrap',
	table	 : 'weibo_artist_site',
	dir		 : path.join(__dirname, "..")
});
