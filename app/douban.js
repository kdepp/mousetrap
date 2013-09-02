
var mouseTrap = require('../mouseTrap'),
	_ = require('lodash');

var config = {
	projectName: 'douban'
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
			, likeNum: {type: 'BIGINT'}
		}
	}
	, routes: [
		// 流派首页
		{
			name: 'genre-home'
			, level: 1
			, urlPattern: 'http://music.douban.com/artists/'
			, toCrawl: {
				genreHome: {
					type: 'link'
					, target: 'genre-detail-home'
					, selector: '.genre-nav li a'
					, fn: function ($dom, crawlingUrl) {
						var link = $dom.attr('href'),
							match = link.match(/^http:\/\/music\.douban\.com\/artists\/genre_page\/(\d+)\//),
							id = match[1];

						if ($dom.html() == '最热榜')	return {};

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
			, urlPattern: /^http:\/\/music\.douban\.com\/artists\/genre_page\/\d+\//
			, toCrawl: {
				genreDetailHome: {
					type: 'link_group'
					, target: 'genre-detail-page'
					, selector: '.paginator > a'
					, fn: function ($dom, crawlingUrl) {
						var $dom = $dom.last(),
							max = ~~$dom.html(),
							match = crawlingUrl.match(/genre_page\/(\d+)/),
							id = match[1];

						return _.map(_.range(1, max + 1), function (i) {
							return {
								genreId: id
								, page: i
								, link: ['http://music.douban.com/artists/genre_page/', id, '/', i].join('')
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
			, urlPattern: /^http:\/\/music\.douban\.com\/artists\/genre_page\/\d+\/\d+/
			, toCrawl: {
				genreDetailPage: {
					type: 'link'
					, target: 'artist-site'
					, selector: '#content .photoin'
					, fn: function ($dom, crawlingUrl) {
						var $img = $dom.find('.artist_photo img'),
							$like = $dom.find('.pl'),
							likeText = $like.html() || '',
							likeMatch = likeText.match(/(\d+)/),
							likeNum = likeMatch && likeMatch.length && likeMatch[1];
							match = crawlingUrl.match(/genre_page\/(\d+)/),
							id = match[1];

						return {
							artistName: $img.attr('alt')
							, artistPhoto_100: $img.attr('src')
							, likeNum: likeNum
							, link: $img.parent().attr('href')
							, genreId: id
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
