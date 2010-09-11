(function($) {
	$.fn.equalHeights = function() {
		tallest = 0;
		this.children().each(function() {
			if(this.height() > tallest) {
				tallest = this.height();
			}
		});
		return this.children().height(tallest);
	}
})(jQuery);