
var mouseTrap = require('../mouseTrap'),
	_ = require('lodash');

var config = {
	projectName: 'milepub'
	, rdb: {
		'tag-detail-home': {
			tagName: {type: 'VARCHAR(255)'}
			, link: {type: 'VARCHAR(255)'}
		}
		, 'artist-site': {
			artistName: {type: 'VARCHAR(255)'}
			, artistPhoto_150: {type: 'VARCHAR(255)'}
			, link: {type: 'VARCHAR(255) UNIQUE'}
		}
	}
	, routes: [
		// tag首页
		{
			name: 'tag-home'
			, level: 1
			, urlPattern: 'http://milepub.cn/tag/Electronic/'
			, toCrawl: {
				tagHome: {
					type: 'link'
					, target: 'tag-detail-home'
					, selector: '#id_tag_cloud_inner > a' , fn: function ($dom, crawlingUrl) { return { tagName: $dom.html()
							, link: "http://milepub.cn" + $dom.attr('href')
						};
					}
				}	
			}
		}
		// tag详情页首页
		, {
			name: 'tag-detail-home'
			, level: 2
			, urlPattern: /^http:\/\/milepub\.cn\/tag\/.*\/Album/
			, toCrawl: {
				genreDetailHome: {
					type: 'link_group'
					, target: 'tag-detail-page'
					, selector: '.pagination a'
					, fn: function ($dom, crawlingUrl) {
						var match = crawlingUrl.match(/tag\/(.+)\/Album/),
							id = match[1];

						var _$dom, max;

						if ($dom.length > 0) {
							_$dom = $dom.eq($dom.length - 2);
							max = ~~_$dom.html();
						} else {
							max = 1;
						}

						return _.map(_.range(1, max + 1), function (i) {
							return {
								tagName: id
								, page: i
								, link: ['http://milepub.cn/tag/', id, '/Album/', i, '/'].join('')
							}
						});
					}
				}
			}
		}
		// tag详情页分页
		, {
			name: 'tag-detail-page'
			, level: 3
			, urlPattern: /^http:\/\/milepub\.cn\/tag\/.*\/Album\/\d+/
			, toCrawl: {
				genreDetailPage: {
					type: 'link'
					, target: 'artist-site'
					, selector: '.itemblock'
					, fn: function ($dom, crawlingUrl) {
						var $img = $dom.find('img'),
							$nameDiv = $dom.find('> div').last(),
							$name = $nameDiv.find('a');

						console.log("@@@@@@@@@@@ name, img: " + $name.html() + ", " + $name.attr('href'));

						return {
							artistName: $name.html()
							, artistPhoto_150: $img.attr('src')
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
