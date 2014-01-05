
var mailer = require("nodemailer"),
	path = require("path");

var smtp = mailer.createTransport("SMTP", {
	host: "smtp.163.com",
	port: 25,
	auth: {
		user: "kickdepp",
		pass: "2kick@depp"
	}
});

smtp.sendMail({
	from: "kickdepp@163.com"
	, to: "fujing01@baidu.com, shiweijia01@baidu.com, wutongzi@baidu.com, lutaining@baidu.com"
	, subject: "音乐人竞品数据"
	, text: "rt~"
	, attachments: [
		{ filePath: path.join(__dirname, "xiami_artist_site.xlsx") }
		, { filePath: path.join(__dirname, "weibo_artist_site.xlsx") }
		, { filePath: path.join(__dirname, "douban_artist_site.xlsx") }
		, { filePath: path.join(__dirname, "5sing_artist_site.xlsx") }
	]
}, function (err, response) {
	if (err) {
		throw err;
	}

	// FIXME process doesn't quit as expected
	throw Error("mail sent, bye");
});

smtp.close();
