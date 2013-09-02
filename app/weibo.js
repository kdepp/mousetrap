
var mouseTrap = require('../mouseTrap'),
	_ = require('lodash');

var config = {
	projectName: 'weibo'
	, rdb: {
		'genre-detail-home': {
			genreId: {type: 'BIGINT', _extra: 'PRIMARY KEY'}
			, genreName: {type: 'VARCHAR(255)'}
			, link: {type: 'VARCHAR(255)'}
		}
		, 'artist-site': {
			genreId: {type: 'BIGINT'}
			, artistName: {type: 'VARCHAR(255)'}
			, artistPhoto_180: {type: 'VARCHAR(255)'}
			, link: {type: 'VARCHAR(255) UNIQUE'}
			, likeNum: {type: 'BIGINT'}
			, shareNum: {type: 'BIGINT'}
			, playNum: {type: 'BIGINT'}
		}
	}
	, routes: [
		// 流派首页
		{
			name: 'genre-home'
			, level: 1
			, urlPattern: 'http://music.weibo.com/snake/snk_artists_list.php'
			, toCrawl: {
				genreHome: {
					type: 'link'
					, target: 'genre-detail-home'
					, selector: '.W_right .tags_A li a'
					, fn: function ($dom, crawlingUrl) {
						var link = $dom.attr('href'),
							match = link.match(/^http:\/\/music\.weibo\.com\/snake\/snk_artists_list\.php\?tagid=(\d+)/),
							id = match[1];

						return {
							genreName: $dom.html().replace(/<.*/g, '')
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
			, urlPattern: /^http:\/\/music\.weibo\.com\/snake\/snk_artists_list\.php\?tagid=\d+/
			, toCrawl: {
				genreDetailHome: {
					type: 'link_group'
					, target: 'genre-detail-page'
					, selector: '.page_down_up li'
					, fn: function ($dom, crawlingUrl) {
						var $dom = $dom.last().prev(),
							max = ~~$dom.find('a').html(),
							match = crawlingUrl.match(/tagid=(\d+)/),
							id = match[1];

						return _.map(_.range(1, max + 1), function (i) {
							return {
								genreId: id
								, page: i
								, link: ['http://music.weibo.com/snake/snk_artists_list.php?tagid=', id, '&page=', i].join('')
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
			, urlPattern: /^http:\/\/music\.weibo\.com\/snake\/snk_artists_list\.php\?tagid=\d+(&page=(\d+))?/
			, toCrawl: {
				genreDetailPage: {
					type: 'link'
					, target: 'artist-site'
					, selector: '.singers_infor'
					, fn: function ($dom, crawlingUrl) {
						var $img = $dom.find('.FL img'),
							$nameDD = $dom.find('.name'),
							$name = $nameDD.find('a'),
							$num = $nameDD.next(),
							numText = $num.length ? $num.html() : '',
							playMatch = numText.match(/(\d+)次播放/),
							shareMatch = numText.match(/(\d+)次分享/),
							likeMatch = numText.match(/(\d+)人喜欢/),
							playNum = playMatch && playMatch.length && playMatch[1],
							shareNum = shareMatch && shareMatch.length && shareMatch[1],
							likeNum = likeMatch && likeMatch.length && likeMatch[1],
							match = crawlingUrl.match(/tagid=(\d+)/),
							id = match[1];

						return {
							genreId: id
							, artistName: $name.html()
							, likeNum: likeNum
							, shareNum: shareNum
							, playNum: playNum
							, artistPhoto_180: $img.attr('src')
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
