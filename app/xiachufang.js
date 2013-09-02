
var mouseTrap = require('../mouseTrap'),
	_ = require('lodash');

var config = {
	projectName: 'xiachufang'
	, rdb: {
		'ctg-detail': {
			ctgId: {type: 'VARCHAR(255)'}
			, ctgName: {type: 'VARCHAR(255)'}
			, link: {type: 'VARCHAR(255)'}
		}
		, 'recipe-site': {
			ctgId: {type: 'VARCHAR(255)'}
			, recipeName: {type: 'VARCHAR(255)'}
			, recipePhoto_140: {type: 'VARCHAR(255)'}
			, link: {type: 'VARCHAR(255)'}
			, score: {type: 'FLOAT'}
			, doneNum: {type: 'BIGINT'}
			, hasStep: {type: 'TINYINT'}
		}
	}
	, routes: [
		// 分类首页
		{
			name: 'ctg-home'
			, level: 1
			, urlPattern: 'http://www.xiachufang.com/category/'
			, toCrawl: {
				genreHome: {
					type: 'link'
					, target: 'ctg-detail'
					, selector: '.cates-list-all li a'
					, fn: function ($dom, crawlingUrl) {
						var link = $dom.attr('href'),
							match = link.match(/category\/(\d+)/),
							id = match[1];

						return {
							ctgName: $dom.html()
							, ctgId: id
							, link: "http://www.xiachufang.com" + link
						};
					}
				}	
			}
		}
		// 分类详情页首页
		, {
			name: 'ctg-detail'
			, level: 2
			, urlPattern: /^http:\/\/www\.xiachufang\.com\/category\/(\d+)/
			, urlPreprocess: function (url) {
				// 使用一个一定超过分类总个数的数字，用以看到最大翻页数
				return url + '?page=100000';
			}
			, toCrawl: {
				genreDetailHome: {
					type: 'link_group'
					, target: 'ctg-detail-page'
					, selector: '.pager .now'
					, fn: function ($dom, crawlingUrl) {
						console.log("count max: " + $dom.length);

						var max = ~~$dom.html(),
							match = crawlingUrl.match(/category\/(\d+)/),
							id = match[1];


						return _.map(_.range(1, max + 1), function (i) {
							return {
								ctgId: id
								, page: i
								, link: ['http://www.xiachufang.com/category/', id, '/?page=', i].join('')
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
			, urlPattern: /^http:\/\/www\.xiachufang\.com\/category\/(.*)\/\d+/
			, toCrawl: {
				genreDetailPage: {
					type: 'link'
					, target: 'recipe-site'
					, selector: '.recipe-list > ul > li'
					, fn: function ($dom, crawlingUrl) {
						var $img = $dom.find('.recipe-cover > a > img'),
							$name = $dom.find('.name a'),
							$step = $dom.find('.step-icon'),
							$stat = $dom.find('.stat'),
							score = $stat.find('.score').html(),
							doneMatch = $stat.html().match(/(\d+)做过/),
							doneNum = doneMatch && doneMatch.length && doneMatch[1];
							match = crawlingUrl.match(/category\/(\d+)\//),
							id = match[1];

						return {
							recipeName: $name.html()
							, recipePhoto_140: $img.attr('src')
							, hasStep: $step.length
							, doneNum: doneNum
							, score: score
							, link: "http://www.xiachufang.com" + $img.parent().attr('href')
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
