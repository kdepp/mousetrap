
var mouseTrap = require('../mouseTrap'),
	_ = require('lodash');

var config = {
	projectName: 'xiami'
	, rdb: {
		'genre-detail-home': {
			genreId: {type: 'BIGINT', _extra: 'PRIMARY KEY'}
			, genreName: {type: 'VARCHAR(255)'}
			, link: {type: 'VARCHAR(255)'}
		}
		, 'artist-site': {
			genreId: {type: 'BIGINT'}
			, artistName: {type: 'VARCHAR(255)'}
			, artistPhoto_100: {type: 'VARCHAR(255)'}
			, link: {type: 'VARCHAR(255) UNIQUE'}
			, fanNum: {type: 'BIGINT'}
		}
	}
	, routes: [
		// 流派首页
		{
			name: 'genre-home'
			, level: 1
			, urlPattern: 'http://i.xiami.com/musician/hot'
			, toCrawl: {
				genreHome: {
					type: 'link'
					, target: 'genre-detail-home'
					, selector: '.musician_tags_con a'
					, fn: function ($dom, crawlingUrl) {
						var link = $dom.attr('href'),
							match = link.match(/^http:\/\/i\.xiami\.com\/genre\/id\/(\d+)/),
							id = match[1];

						return {
							genreName: $dom.html()
							, genreId: id
							, link: link
						};
					}
				}	
			}
		}
		// 流派详情页首页
		, {
			name: 'genre-detail-home'
			, level: 2
			, urlPattern: /^http:\/\/i\.xiami\.com\/musician\/genre\/id\/\d+/
			, toCrawl: {
				genreDetailHome: {
					type: 'link_group'
					, target: 'genre-detail-page'
					, selector: '.all_page a'
					, fn: function ($dom, crawlingUrl) {
						console.log("$$$$$$$$$$$$$ anchor count: " + $dom.length);
						var match = crawlingUrl.match(/id\/(\d+)/),
							id = match[1];

						var _$dom, max;

						if ($dom.length > 0) {
							_$dom = $dom.last().prev();
							max = ~~_$dom.html();
						} else {
							max = 1;
						}

						return _.map(_.range(1, max + 1), function (i) {
							return {
								genreId: id
								, page: i
								, link: ['http://i.xiami.com/musician/genre/id/', id, '/page/', i].join('')
							}
						});
					}
				}
			}
		}
		// 流派详情页分页
		, {
			name: 'genre-detail-page'
			, level: 3
			, urlPattern: /^http:\/\/i\.xiami\.com\/musician\/genre\/id\/\d+\/page\/\d+/
			, toCrawl: {
				genreDetailPage: {
					type: 'link'
					, target: 'artist-site'
					, selector: '.artist'
					, fn: function ($dom, crawlingUrl) {
						var $img = $dom.find('.image img'),
							$name = $dom.find('.info p strong a'),
							$fan = $dom.find('.info p').last(),
							fanText = $fan.html(),
							fanMatch = fanText.match(/(\d+)/),
							fanNum = fanMatch[1],
							match = crawlingUrl.match(/genre\/id\/(\d+)/),
							id = match[1];

						return {
							genreId: id
							, artistName: $name.html()
							, artistPhoto_100: $img.attr('src')
							, fanNum: fanNum
							, link: $name.attr('href')
						};
					}
				}
			}
		}
		// 音乐人小站
		/*
		, {
			name: 'artist-site'
			, level: 4
			, urlPattern: /^http:\/\/site\.douban\.com\/[^\/]+\//
			, toCrawl: {
				artist: {
					type: 'basic'
					, target: 'artist-data'
					, selector: '#sp-user .user-pic img'
					, fn: function ($dom, crawlingUrl) {
						return {
							artistPhoto_160: $dom.attr('src')
						}
					}
				}
			}
		}
		*/
	]
};

mouseTrap.taskCenter.init(config);
