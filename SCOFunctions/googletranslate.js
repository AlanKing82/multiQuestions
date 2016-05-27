// $Rev: 6141 $ $Date: 2014-09-03 12:26:38 +0100 (Wed, 03 Sep 2014) $ $Author: jan $

// google translate API(GT)
function googleTranslateElementInit() {
	// index page display selector as only drop down in certain div	
	if( location.href.indexOf('index.html') > 0 )
		new google.translate.TranslateElement({
		  pageLanguage: 'en',
		  layout: google.translate.TranslateElement.InlineLayout.SIMPLE
		}, 'google_translate_element' );
		
	// other pages  uses top toolbar approach
	else
		new google.translate.TranslateElement({
			pageLanguage: 'en',
			floatPosition: google.translate.TranslateElement.FloatPosition.TOP_LEFT
		});
}

// clean up some GT css on the fly
function cleanMinHeight()
{
	var style = document.body.style;
	
	if( style.minHeight == '100%' )
	{
		style.minHeight = '1px';
		style.top = '0px';
		
		
		// concept for automatic GT listing 
		//showGtLanguages();
		
		clearInterval( cleanMinHeightInterval );
	}
}

// automatically display all languages of GT
function showGtLanguages()
{
    var page = $('#gtColumn');
    var offset = page.offset();
    var margin = 10;
    $('.goog-te-menu-frame:first').css({ 
        display:'block',
        top:offset.top+margin,
        left:offset.left+margin,
        width: page.width(),
        overflow: 'auto'
    }); 
}


//load Goggle Translate API
var gtAPIUrl = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
if( typeof addJs != 'undefined' )
    addJs( gtAPIUrl, document )
else if( typeof parent.addJs != 'undefined' )
    parent.addJs( gtAPIUrl, document );