
var mouseTrap = require('../mouseTrap'),
	_ = require('lodash');

var config = {
	projectName: '5sing'
	, rdb: {
		'artist-site': {
			artistName: {type: 'VARCHAR(255)'}
			, artistPhoto_90: {type: 'VARCHAR(255)'}
			, link: {type: 'VARCHAR(255) UNIQUE'}
		}
	}
	, routes: [
		// 流派首页
		{
			name: 'home-page'
			, level: 1
			, urlPattern: 'http://www.5sing.com/artists/all'
			, toCrawl: {
				homePage: {
					type: 'link_group'
					, target: 'list-page'
					, selector: '.page li a'
					, fn: function ($dom, crawlingUrl) {
						var $dom = $dom.last(),
							link = $dom.attr('href'),
							match = link.match(/(\d+)$/),
							max = ~~match[1];

						return _.map(_.range(1, max + 1), function (i) {
							return {
								page: i
								, link: ['http://www.5sing.com/artists/all--', i].join('')
							}
						});
					}
				}	
			}
		}
		// 流派详情页首页
		, {
			name: 'list-page'
			, level: 2
			, urlPattern: /^http:\/\/www\.5sing\.com\/artists\/all--\d+/
			, toCrawl: {
				listPage: {
					type: 'link'
					, selector: '.yl_items > li'
					, target: 'artist-site'
					, fn: function ($dom, crawlingUrl) {
						var $name = $dom.find("h4 a"),
							$img = $dom.find("img");

						return {
							artistName: $name.html(),
							artistPhoto_90: $img.attr("src"),
							link: $name.attr("href")
						}
					}
				}
			}
		}
	]
};

mouseTrap.taskCenter.init(config);
