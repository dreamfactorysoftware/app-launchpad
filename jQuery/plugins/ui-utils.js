/**
 * (c)2012 YouCanGetMe at Yahoo dot Com, All Rights Reserved.
 * A jQuery Plugin to wrpa up certain reusable functions not
 * tied to a overall framework.
 * 
 * @author jb
 */
(function($){
	var Methods = {
		/**
		 * Turns on or off a groups of UI elements. Specifically
		 * used to enable, disable groups of buttons for control
		 * of submissions.
		 * 
		 * @param opts
		 * @param action
		 */
		grpCtrlELements: function(opts,action) {
			var els = opts.elements;
			for(var i in els) {
				if(i instanceof Function) continue;
				var obj = els[i];
				var id = null;
				if(obj.type == 'class') {
					id = '.'+i;
				} else {
					id = '#'+i;
				}
				var rule = obj.rule;
				var method = obj.method;
				var params = obj.actions[action];
				if(rule && !rule()) continue;
				var el = $(i);
				if(el && el[method] instanceof Function) {
					el[method](params);
				}
			}
		},
		/**
		 * Creates an element to be controlled within a group
		 * @param type
		 * @param rule
		 * @param method
		 * @param actions
		 * @returns group control element
		 */
		createGrpCtrlElement: function(type,rule,method,actions) {
			return {
				'type':type,
				'rule':rule,
				'method':method,
				'actions':actions
			};
		}
	};
	$.fn.snzUtils = function( method ) {
		if (Methods[method] ) {
			return Methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return Methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.snzUtils' );
		}
	};
})(jQuery);