
var mouseTrap = require('../mouseTrap'),
	_ = require('lodash');

var config = {
	projectName: 'douguo'
	, rdb: {
		'ctg-detail': {
			ctgId: {type: 'VARCHAR(255) UNIQUE'}
			, ctgName: {type: 'VARCHAR(255)'}
			, link: {type: 'VARCHAR(255)'}
		}
		, 'recipe-site': {
			ctgId: {type: 'VARCHAR(255)'}
			, recipeName: {type: 'VARCHAR(255)'}
			, recipePhoto_190: {type: 'VARCHAR(255)'}
			, link: {type: 'VARCHAR(255)'}
			, ownerName: {type: 'VARCHAR(255)'}
			, ownerLink: {type: 'VARCHAR(255)'}
			, likeNum: {type: 'BIGINT'}
			, commentNum: {type: 'BIGINT'}
			, _extra: 'UNIQUE(ctgId, link)'
		}
	}
	, routes: [
		// 分类首页
		{
			name: 'ctg-home'
			, level: 1
			, urlPattern: 'http://www.douguo.com/caipu/fenlei'
			, toCrawl: {
				genreHome: {
					type: 'link'
					, target: 'ctg-detail'
					, selector: '.fei3 .kbi li a'
					, fn: function ($dom, crawlingUrl) {
						var link = $dom.attr('href'),
							match = link.match(/^http:\/\/www\.douguo\.com\/caipu\/(.*)/),
							id = match[1];

						return {
							ctgName: $dom.attr('title')
							, ctgId: id
							, link: link
						};
					}
				}	
			}
		}
		// 分类详情页首页
		, {
			name: 'ctg-detail'
			, level: 2
			, urlPattern: /^http:\/\/www\.douguo\.com\/caipu\/(.*)/
			, urlPreprocess: function (url) {
				// 使用一个一定超过分类总个数的数字，用以看到最大翻页数
				return url + '/100000';
			}
			, toCrawl: {
				genreDetailHome: {
					type: 'link_group'
					, target: 'ctg-detail-page'
					, selector: '.pagination .current'
					, fn: function ($dom, crawlingUrl) {
						console.log("count max: " + $dom.length);

						var max = ~~$dom.html(),
							match = crawlingUrl.match(/caipu\/(.*)\//),
							id = match[1];


						return _.map(_.range(1, max + 1), function (i) {
							return {
								ctgId: id
								, page: i
								, link: ['http://www.douguo.com/caipu/', id, '/', 30 * (i - 1)].join('')
							}
						});
					}
				}
			}
		}
		// 流派详情页分页
		, {
			name: 'ctg-detail-page'
			, level: 3
			, urlPattern: /^http:\/\/www\.douguo\.com\/caipu\/(.*)\/\d+/
			, toCrawl: {
				genreDetailPage: {
					type: 'link'
					, target: 'recipe-site'
					, selector: '.course'
					, fn: function ($dom, crawlingUrl) {
						var $img = $dom.find('.recpio > a > img'),
							$owner = $dom.find('.cfabu .fcc a').first()
							$like = $dom.find('> span'),
							likeText = $like.html() || '',
							likeMatch = likeText.match(/(\d+)收藏/),
							likeNum = likeMatch && likeMatch.length && likeMatch[1];
							commentMatch = likeText.match(/(\d+)评论/),
							commentNum = commentMatch && commentMatch.length && commentMatch[1];
							match = crawlingUrl.match(/caipu\/(.*)\//),
							id = match[1];

						if ($img.length <= 0)	return {};

						return {
							recipeName: $img.attr('alt')
							, recipePhoto_190: $img.attr('src')
							, ownerName: $owner.html()
							, ownerLink: $owner.attr('href')
							, likeNum: likeNum
							, commentNum: commentNum
							, link: $img.parent().attr('href')
							, ctgId: id
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
