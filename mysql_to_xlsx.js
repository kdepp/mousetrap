
var xlsx = require("node-xlsx"),
	fs = require("fs"),
	mysql = require("mysql"),
	 _ = require("lodash");

var mysql_to_xlsx = function (config) {
	var connection = mysql.createConnection(config),
		reg = new RegExp("[\\u0000-\\u0010]*", "g");

	connection.connect();

	connection.query("select * from " + config.table, function (err, rows, fields) {
		if (err)	throw err;
		var result = {
				worksheets: [
					{
						name: "sheet",
						data: []
					}
				]
			},
			data = [],
			buffer;


		data = _.map(rows, function (item) {
			var arr = [];

			_.each(fields, function (field) {
				var value = item[field.name];

				if (value === null) {
					value = 0;
				} else if (_.isString(value)) {
					value = value.replace(reg, "");
				}

				arr.push(value);
			});	

			return arr;
		});

		data.unshift(_.map(fields, function (field) {
			return field.name;
		}));

		result.worksheets[0].data = data;

		buffer = xlsx.build(result);

		fs.writeFile((config.dir || ".") + "/" + config.table + ".xlsx", buffer, function (err) {
			console.log("xlsx file written");
		});
	});

	connection.end();
};

exports.mysql_to_xlsx = mysql_to_xlsx;

