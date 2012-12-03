/** Dream Factory Drag-n-Drop File Uploader */
(function($){

	/**
	 * May be a better way to do this...
	 */
	function processEvent(e) {
		e.originalEvent.stopPropagation();
		e.originalEvent.preventDefault();
		return e.originalEvent;
	}
	
	/**
	 * 
	 */
	function handleFileSelect(evt) {
		var e = processEvent(evt);
		$(e.currentTarget).dfDropFile('sendFiles',e.dataTransfer.files);
	}
	
	/**
	 * 
	 */
	function handleDragOver(evt) {
		processEvent(evt).dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
	}

	var options = null;
	
	/**
	 * 
	 */
	var Methods = {
		/**
		 * 
		 * @param files
		 * @returns {___anonymous585_1654}
		 */
		sendFiles: function(files) {
			for(var i = 0; i < files.length ; i++) {
				this.dfDropFile('sendFile',files[i]);
			}
			return this;
		},
		/**
		 * 
		 * @param file
		 * @returns {___anonymous585_1727}
		 */
		sendFile: function(file) {
			var type = $(this).data('type');
			var params = null;
			if(file.name.indexOf(".zip") != -1) {
				if(confirm("Do you want to expand "+file.name+" on upload?")) {
					params = {
						expand: true
					};
				}
			}
			if(type == 'folder') {
				var target = $(this).data('target');
				if(target == "??CURRENT??") {
					options.uploader.upload(file,params);
				} else {
					options.uploader.upload(file,params,"/"+target);
				}
			} else {
				options.uploader.upload(file,params);
			}
			return this;
		},
		/**
		 * 
		 * @param opts
		 * @returns
		 */
		init : function(opts) {
			if(opts) options = opts;
			return $(this).bind('dragover',handleDragOver).bind('drop',handleFileSelect);
		}
	};
	$.fn.dfDropFile = function( method ) {
		if (Methods[method] ) {
			return Methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return Methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.dfDropFile' );
		}
	};
})(jQuery);