/** Dream Factory Data Pager Plugin */
(function($){
	var Methods = {
		limit: function(index) {
			var id = this.attr('id');
			if(index < this.dfPager.pagers[id].request.pageLimits.length && index > -1) {
				this.dfPager.pagers[id].request.pageLimit = index;
			}
		},
		sortBy: function(index) {
			var id = this.attr('id');
			if(index < this.dfPager.pagers[id].request.orderFields.length && index > -1) {
				this.dfPager.pagers[id].request.orderBy = index;
			}
		},
		nextPage: function() {
			var id = this.attr('id');
			this.dfPager.pagers[id].request.pageNo++;
		},
		prevPage: function() {
			var id = this.attr('id');
			if(this.dfPager.pagers[id].request.pageNo > 0) {
				this.dfPager.pagers[id].request.pageNo--;
			} else {
				this.dfPager.pagers[id].request.pageNo = 0;
			}
		},
		getPage: function() {
			var id = this.attr('id');
			return this.dfPager.pagers[id].request.pageNo;
		},
		gotoPage: function(page) {
			var id = this.attr('id');
			if(page > 0) {
				this.dfPager.pagers[id].request.pageNo = page;
			} else {
				this.dfPager.pagers[id].request.pageNo = 0;
			}
		},
		destroy: function() {
			var id = this.attr('id');
			return this.dfPager.pagers[id] = null;
		},
		setResultCount: function(total) {
			var id = this.attr('id');
			this.dfPager.pagers[id].request.resultCount = total;
			this.dfPager.pagers[id].request.pageCount = Math.ceil(this.dfPager.pagers[id].request.resultCount / this.dfPager.pagers[id].request.pageLimits[this.dfPager.pagers[id].request.pageLimit]);
		},
		getResultCount: function() {
			var id = this.attr('id');
			return this.dfPager.pagers[id].request.resultCount;
		},
		dataready: function(json) {
			var id = this.attr('id');
			var reason = checkFailure(json);
			if(reason == undefined) {
				if(json.meta && json.meta.total) {
					var total = json.meta.total;
					this.dfPager('setResultCount',parseInt(json.meta.total));
				}
				this.dfPager.pagers[id].success(json);
			} else {
				this.dfPager('dataerror',reason);
			}
		},
		dataerror: function(reason) {
			var id = this.attr('id');
			this.dfPager.pagers[id].error(reason);
			
			if(reason && reason.indexOf && reason.indexOf('[INVALIDSESSION]:') != -1) {
				if(parent && parent.doSignIn) {
					parent.doSignIn();
				} else if(doSignIn) {
					parent.doSignIn();
				}
			}
		},
		fetch: function() {
			var id = this.attr('id');
			this.dfPager.pagers[id].retrieve({
				order: this.dfPager.pagers[id].request.orderFields[this.dfPager.pagers[id].request.orderBy],
				offset: this.dfPager.pagers[id].request.pageNo*this.dfPager.pagers[id].request.pageLimits[this.dfPager.pagers[id].request.pageLimit],
				limit: this.dfPager.pagers[id].request.pageLimits[this.dfPager.pagers[id].request.pageLimit]
			});
		},
		getLimit: function() {
			var id = this.attr('id');
			return this.dfPager.pagers[id].request.pageLimits[this.dfPager.pagers[id].request.pageLimit];
		},
		getRequest: function() {
			var id = this.attr('id');
			return this.dfPager.pagers[id];
		},
		init : function(opts) {
			var id = this.attr('id');
			opts.success = function(json) { // because we are called outside of scope we need the ID
				$('#'+id).dfPager('dataready',json);
			};
			opts.error = function(err) { // because we are called outside of scope we need the ID
				$('#'+id).dfPager('dataerror',err);
			};
			this.dfPager.pagers[id] = new DFRequest(opts);
			return this;
		}
	};
	$.fn.dfPager = function( method ) {
		if (Methods[method] ) {
			return Methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return Methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.dfPager' );
		}
	};
	$.fn.dfPager.pagers = {};
	$.fn.dfPager.version = 'dfPager v0.0.22';
})(jQuery);