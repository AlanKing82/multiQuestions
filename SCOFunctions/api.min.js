/*******************************************************************************
** 
** Filename: SCOFunctions.js
**
** File Description: This file contains several JavaScript functions that are 
**                   used by the Sample SCOs contained in the Sample Course.
**                   These functions encapsulate actions that are taken when the
**                   user navigates between SCOs, or exits the Lesson.
**
** Author: ADL Technical Team
**
** Contract Number:
** Company Name: CTC
**
** Design Issues:
**
** Implementation Issues:
** Known Problems:
** Side Effects:
**
** References: ADL SCORM
**
/*******************************************************************************
**
** Concurrent Technologies Corporation (CTC) grants you ("Licensee") a non-
** exclusive, royalty free, license to use, modify and redistribute this
** software in source and binary code form, provided that i) this copyright
** notice and license appear on all copies of the software; and ii) Licensee
** does not utilize the software in a manner which is disparaging to CTC.
**
** This software is provided "AS IS," without a warranty of any kind.  ALL
** EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING ANY
** IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR NON-
** INFRINGEMENT, ARE HEREBY EXCLUDED.  CTC AND ITS LICENSORS SHALL NOT BE LIABLE
** FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING OR
** DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES.  IN NO EVENT WILL CTC  OR ITS
** LICENSORS BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA, OR FOR DIRECT,
** INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER
** CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING OUT OF THE USE OF
** OR INABILITY TO USE SOFTWARE, EVEN IF CTC  HAS BEEN ADVISED OF THE
** POSSIBILITY OF SUCH DAMAGES.
**
*******************************************************************************/

var _Debug = false;  // set this to false to turn debugging off
                     // and get rid of those annoying alert boxes.
var _Offline = true; // set to TRUE to avoid checking API (for development mode)
// Define exception/error codes
var _NoError = 0;
var _GeneralException = 101;
var _ServerBusy = 102;
var _InvalidArgumentError = 201;
var _ElementCannotHaveChildren = 202;
var _ElementIsNotAnArray = 203;
var _NotInitialized = 301;
var _NotImplementedError = 401;
var _InvalidSetValue = 402;
var _ElementIsReadOnly = 403;
var _ElementIsWriteOnly = 404;
var _IncorrectDataType = 405;


// local variable definitions
var apiHandle = null;
var API = null;
var findAPITries = 0;
var afterLmsFinish = false;

var startDate;
var exitPageStatus;

// whether not to show further API alerts after error
var preventAlert = false;

// for offline browsing, don't display alerts
function messageAlert( message )
{
	if(_Offline == false)
	{
		if(!preventAlert) {
			preventAlert = true;		
			message = '== PROBLEM SUBMITTING PAGE ==\n\nThere appears to have been a problem submitting your progress during this course. Please close the course window and launch once again. \n\nTechnical details:\n' +
				message;
			alert(message);			
		}
	}		
}

/*******************************************************************************
**
** Function: doLMSInitialize()
** Inputs:  None
** Return:  CMIBoolean true if the initialization was successful, or
**          CMIBoolean false if the initialization failed.
**
** Description:
** Initialize communication with LMS by calling the LMSInitialize
** function which will be implemented by the LMS.
**
*******************************************************************************/
function doLMSInitialize()
{ 
   var api = getAPIHandle();
   if (api == null)
   {
      messageAlert("Unable to locate the LMS's API Implementation.\nLMSInitialize was not successful.");
      return "false";
   }

   var result = api.LMSInitialize("");

   if (result.toString() != "true")
   {

      var err = ErrorHandler();
   }

   return result.toString();
}

/*******************************************************************************
**
** Function doLMSFinish()
** Inputs:  None
** Return:  CMIBoolean true if successful
**          CMIBoolean false if failed.
**
** Description:
** Close communication with LMS by calling the LMSFinish
** function which will be implemented by the LMS
**
*******************************************************************************/
function doLMSFinish()
{
   // ignore all calls except the first one
   if( afterLmsFinish )
	 return "true";
   
   
   var api = getAPIHandle();
   if (api == null)
   {
      messageAlert("Unable to locate the LMS's API Implementation.\nLMSFinish was not successful.");
      return "false";
   }
   else
   {
	  // set time/duration signal
	  computeTime();	

	  // call the LMSFinish function that should be implemented by the API
      var result = api.LMSFinish("");
      if (result.toString() != "true")
      {
         var err = ErrorHandler();
      }
	  
	  // block further calls for LMSFinish
	  else
		afterLmsFinish = true;

   }

   return result.toString();
}

/*******************************************************************************
**
** Function doLMSGetValue(name)
** Inputs:  name - string representing the cmi data model defined category or
**             element (e.g. cmi.core.student_id)
** Return:  The value presently assigned by the LMS to the cmi data model
**       element defined by the element or category identified by the name
**       input value.
**
** Description:
** Wraps the call to the LMS LMSGetValue method
**
*******************************************************************************/
function doLMSGetValue(name)
{
   var api = getAPIHandle();
   if (api == null)
   {
      messageAlert("Unable to locate the LMS's API Implementation.\nLMSGetValue was not successful.");
      return "";
   }
   else
   {
      var value = api.LMSGetValue(name);
      var errCode = api.LMSGetLastError().toString();
      if (errCode != _NoError)
      {
         // an error was encountered so display the error description
         var errDescription = api.LMSGetErrorString(errCode);
         messageAlert("LMSGetValue("+name+") failed. \n"+ errDescription);
         return "";
      }
      else
      {
         
         return value.toString();
      }
   }
}

/*******************************************************************************
**
** Function doLMSSetValue(name, value)
** Inputs:  name -string representing the data model defined category or element
**          value -the value that the named element or category will be assigned
** Return:  CMIBoolean true if successful
**          CMIBoolean false if failed.
**
** Description:
** Wraps the call to the LMS LMSSetValue function
**
*******************************************************************************/
function doLMSSetValue(name, value)
{
   var api = getAPIHandle();
   if (api == null)
   {
      messageAlert("Unable to locate the LMS's API Implementation.\nLMSSetValue was not successful.");
      return;
   }
   else
   {
      var result = api.LMSSetValue(name, value);
      if (result.toString() != "true")
      {
         var err = ErrorHandler();
      }
   }

   return;
}

/*******************************************************************************
**
** Function doLMSCommit()
** Inputs:  None
** Return:  None
**
** Description:
** Call the LMSCommit function 
**
*******************************************************************************/
function doLMSCommit()
{ 
   var api = getAPIHandle();
   if (api == null)
   {
      messageAlert("Unable to locate the LMS's API Implementation.\nLMSCommit was not successful.");
      return "false";
   }
   else
   {
      var result = api.LMSCommit("");
      if (result != "true")
      {
         var err = ErrorHandler();
      }
   }

   return result.toString();
}

/*******************************************************************************
**
** Function doLMSGetLastError()
** Inputs:  None
** Return:  The error code that was set by the last LMS function call
**
** Description:
** Call the LMSGetLastError function 
**
*******************************************************************************/
function doLMSGetLastError()
{
   var api = getAPIHandle();
   if (api == null)
   {
      messageAlert("Unable to locate the LMS's API Implementation.\nLMSGetLastError was not successful.");
      //since we can't get the error code from the LMS, return a general error
      return _GeneralError;
   }

   return api.LMSGetLastError().toString();
}

/*******************************************************************************
**
** Function doLMSGetErrorString(errorCode)
** Inputs:  errorCode - Error Code
** Return:  The textual description that corresponds to the input error code
**
** Description:
** Call the LMSGetErrorString function 
**
********************************************************************************/
function doLMSGetErrorString(errorCode)
{
   var api = getAPIHandle();
   if (api == null)
   {
      messageAlert("Unable to locate the LMS's API Implementation.\nLMSGetErrorString was not successful.");
   }

   return api.LMSGetErrorString(errorCode).toString();
}

/*******************************************************************************
**
** Function doLMSGetDiagnostic(errorCode)
** Inputs:  errorCode - Error Code(integer format), or null
** Return:  The vendor specific textual description that corresponds to the 
**          input error code
**
** Description:
** Call the LMSGetDiagnostic function
**
*******************************************************************************/
function doLMSGetDiagnostic(errorCode)
{
   var api = getAPIHandle();
   if (api == null)
   {
      messageAlert("Unable to locate the LMS's API Implementation.\nLMSGetDiagnostic was not successful.");
   }

   return api.LMSGetDiagnostic(errorCode).toString();
}

/*******************************************************************************
**
** Function LMSIsInitialized()
** Inputs:  none
** Return:  true if the LMS API is currently initialized, otherwise false
**
** Description:
** Determines if the LMS API is currently initialized or not.
**
*******************************************************************************/
function LMSIsInitialized()
{
   // there is no direct method for determining if the LMS API is initialized
   // for example an LMSIsInitialized function defined on the API so we'll try
   // a simple LMSGetValue and trap for the LMS Not Initialized Error

   var api = getAPIHandle();
   if (api == null)
   {
      messageAlert("Unable to locate the LMS's API Implementation.\nLMSIsInitialized() failed.");
      return false;
   }
   else
   {
      var value = api.LMSGetValue("cmi.core.student_name");
      var errCode = api.LMSGetLastError().toString();
      if (errCode == _NotInitialized)
      {
         return false;
      }
      else
      {
         return true;
      }
   }
}

/*******************************************************************************
**
** Function ErrorHandler()
** Inputs:  None
** Return:  The current value of the LMS Error Code
**
** Description:
** Determines if an error was encountered by the previous API call
** and if so, displays a message to the user.  If the error code
** has associated text it is also displayed.
**
*******************************************************************************/
function ErrorHandler()
{
   var api = getAPIHandle();
   if (api == null)
   {
      messageAlert("Unable to locate the LMS's API Implementation.\nCannot determine LMS error code.");
      return;
   }

   // check for errors caused by or from the LMS
   var errCode = api.LMSGetLastError().toString();
   if (errCode != _NoError)
   {
      // an error was encountered so display the error description
      var errDescription = api.LMSGetErrorString(errCode);

      if (_Debug == true)
      {
         errDescription += "\n";
         errDescription += api.LMSGetDiagnostic(null);
         // by passing null to LMSGetDiagnostic, we get any available diagnostics
         // on the previous error.
      }

      messageAlert(errDescription);
   }

   return errCode;
}

/******************************************************************************
**
** Function getAPIHandle()
** Inputs:  None
** Return:  value contained by APIHandle
**
** Description:
** Returns the handle to API object if it was previously set,
** otherwise it returns null
**
*******************************************************************************/
function getAPIHandle()
{
   if (apiHandle == null)
   {
      apiHandle = getAPI();
   }

   return apiHandle;
}


/*******************************************************************************
**
** Function findAPI(win)
** Inputs:  win - a Window Object
** Return:  If an API object is found, it's returned, otherwise null is returned
**
** Description:
** This function looks for an object named API in parent and opener windows
**
*******************************************************************************/
function findAPI(win)
{
   while ((win.API == null) && (win.parent != null) && (win.parent != win))
   {
      findAPITries++;
      // Note: 7 is an arbitrary number, but should be more than sufficient
      if (findAPITries > 7) 
      {
         messageAlert("Error finding API -- too deeply nested.");
         return null;
      }
      
      win = win.parent;

   }
   return win.API;
}



/*******************************************************************************
**
** Function getAPI()
** Inputs:  none
** Return:  If an API object is found, it's returned, otherwise null is returned
**
** Description:
** This function looks for an object named API, first in the current window's 
** frame hierarchy and then, if necessary, in the current window's opener window
** hierarchy (if there is an opener window).
**
*******************************************************************************/
function getAPI()
{

   var theAPI = findAPI(window);

   if (((theAPI == null) || (theAPI == "undefined")) && (window.opener != null) && (typeof(window.opener) != "undefined"))
   {
      theAPI = findAPI(window.opener);
   }

   if (((theAPI == null) || (theAPI == "undefined")) && top.opener != null) {
    theAPI = findAPI(top.opener);
   }

   if ((theAPI == null) || (theAPI == "undefined"))
   {
      messageAlert("Unable to find an API adapter");
   }
   return theAPI
} 


function loadPage()
{
   // initialize it if it hasn't been already initialized in index.html 
   if( ! LMSIsInitialized() )
	 var result = doLMSInitialize();

   var status = doLMSGetValue( "cmi.core.lesson_status" );

   if (status == "not attempted" )
   {
	  // the student is now attempting the lesson
	  doLMSSetValue( "cmi.core.lesson_status", "incomplete" );
   }

   exitPageStatus = false;
   startTimer();
}


function startTimer()
{
    // check if timer hasn't been startet already
    if( parent.playerSessionTimer == null )
        parent.playerSessionTimer =  new Date().getTime();
        
    // use timer variable from player frame
    startDate = parent.playerSessionTimer;
}

function computeTime()
{
   if ( startDate != 0 )
   {
      var currentDate = new Date().getTime();
      var elapsedSeconds = ( (currentDate - startDate) / 1000 );
      var formattedTime = convertTotalSeconds( elapsedSeconds );
   }
   else
   {
      formattedTime = "00:00:00.0";
   }

   doLMSSetValue( "cmi.core.session_time", formattedTime );
}

function doBack()
{
   doLMSSetValue( "cmi.core.exit", "suspend" );

   computeTime();
   exitPageStatus = true;
   
   var result;

   result = doLMSCommit();

	// NOTE: LMSFinish will unload the current SCO.  All processing
	//       relative to the current page must be performed prior
	//		 to calling LMSFinish.   
   	
   result = doLMSFinish();

}

function doContinue( status )
{
   // Reinitialize Exit to blank
   doLMSSetValue( "cmi.core.exit", "" );

   var mode = doLMSGetValue( "cmi.core.lesson_mode" );

   if ( mode != "review"  &&  mode != "browse" )
   {
      doLMSSetValue( "cmi.core.lesson_status", status );
   }
 
   computeTime();
   exitPageStatus = true;
   
   var result;
   result = doLMSCommit();
	// NOTE: LMSFinish will unload the current SCO.  All processing
	//       relative to the current page must be performed prior
	//		 to calling LMSFinish.   

   result = doLMSFinish();

}

function doQuit( status )
{
   // compute time only if LMSFinish wasn't callet earlier
   if( ! afterLmsFinish )
	computeTime();
   
   exitPageStatus = true;
   
   var result;

   
   if( status != null && ! afterLmsFinish ) {
	result = doLMSSetValue("cmi.core.lesson_status", status);
   }

   result = doLMSFinish();
}

/*******************************************************************************
** The purpose of this function is to handle cases where the current SCO may be 
** unloaded via some user action other than using the navigation controls 
** embedded in the content.   This function will be called every time an SCO
** is unloaded.  If the user has caused the page to be unloaded through the
** preferred SCO control mechanisms, the value of the "exitPageStatus" var
** will be true so we'll just allow the page to be unloaded.   If the value
** of "exitPageStatus" is false, we know the user caused to the page to be
** unloaded through use of some other mechanism... most likely the back
** button on the browser.  We'll handle this situation the same way we 
** would handle a "quit" - as in the user pressing the SCO's quit button.
*******************************************************************************/
function unloadPage( status )
{

	if (exitPageStatus != true)
	{
		doQuit( status );
	}

	// NOTE:  don't return anything that resembles a javascript
	//		  string from this function or IE will take the
	//		  liberty of displaying a confirm message box.
	
}

/*******************************************************************************
** this function will convert seconds into hours, minutes, and seconds in
** CMITimespan type format - HHHH:MM:SS.SS (Hours has a max of 4 digits &
** Min of 2 digits
*******************************************************************************/
function convertTotalSeconds(ts)
{
   var sec = (ts % 60);

   ts -= sec;
   var tmp = (ts % 3600);  //# of seconds in the total # of minutes
   ts -= tmp;              //# of seconds in the total # of hours

   // convert seconds to conform to CMITimespan type (e.g. SS.00)
   sec = Math.round(sec*100)/100;
   
   var strSec = new String(sec);
   var strWholeSec = strSec;
   var strFractionSec = "";

   if (strSec.indexOf(".") != -1)
   {
      strWholeSec =  strSec.substring(0, strSec.indexOf("."));
      strFractionSec = strSec.substring(strSec.indexOf(".")+1, strSec.length);
   }
   
   if (strWholeSec.length < 2)
   {
      strWholeSec = "0" + strWholeSec;
   }
   strSec = strWholeSec;
   
   if (strFractionSec.length)
   {
      strSec = strSec+ "." + strFractionSec;
   }


   if ((ts % 3600) != 0 )
      var hour = 0;
   else var hour = (ts / 3600);
   if ( (tmp % 60) != 0 )
      var min = 0;
   else var min = (tmp / 60);

   if ((new String(hour)).length < 2)
      hour = "0"+hour;
   if ((new String(min)).length < 2)
      min = "0"+min;

   var rtnVal = hour+":"+min+":"+strSec;

   return rtnVal;
}

//var initialised = false;
//var completed = false;
var studentScore = 0;
var currentScreenNo = 1;
var currentLessonNo;
var noOfLessons;
var autobookmarking = 0; // 0 - no autobookmarking
var lessonFolder;
currentAnswer = 0;
var lessonMessage = false;

// tool kit for developers
var developmentMode = true;

// OLAS 2 configuration object - has loaded data from OLAS 2 LMS
var olas2Config = null;

/**
 * Tracking mode
 * - auto: detecting OLAS and applying OLAS mode if available
 * - true - SCORM strict mode(LMSCommit on last screen and summary)
 * - false - OLAS mode(LMSFinish on last screen and summary)
 */
var SCORMStrictMode = 'auto';

getContentFolderName();

var nextButton = '';
var prevButton = '';
var isSingleSco = window.name == 'lessonFrame' || location.href.indexOf('player.html'); // second condition is for player.html
    function SetOpacity(elem, opacityAsInt){
        var opacityAsDecimal = opacityAsInt;
        if (opacityAsInt > 100)
            opacityAsInt = opacityAsDecimal = 100;
        else
            if (opacityAsInt < 0)
                opacityAsInt = opacityAsDecimal = 0;
        opacityAsDecimal /= 100;
        if (opacityAsInt < 1)
            opacityAsInt = 1;
        elem.style.opacity = (opacityAsDecimal);
        elem.style.filter = "alpha(opacity=" + opacityAsInt + ")";
    }

	/**
	 *  Set relevant opacity for button
	 *  button (text) 'next' or 'prev'
	 *  enable (bool) TRUE - make it enabled, FALSE - make it disabled
	*/
	function toggleButton( button, enable )
	{
		var buttonEl = ( button == 'next' ) ? nextButton : prevButton;
		
		if( ! buttonEl )
			return;
		
		// setting for disabled button( for default)
		var buttonOpacity = 20, buttonResult = 'false';

		// set settings for enabled button
		if(	enable )
		{
			buttonOpacity = 100;
			buttonResult = 'true';
		}
			
		// button image reference	
		buttonImgEl = document.getElementById( button + '_link');	
		
		// if image doesn't exist then get out of here
		if( ! buttonImgEl )
			return;
		
		SetOpacity( buttonImgEl, buttonOpacity );
		buttonEl.onclick = new Function('return ' + buttonResult + ';');
	}
	
    function disable( both ){
        // disable next button if exist
		if( nextButton )
			toggleButton( 'next', false );
		
		// disable back button if exist and both param is true
		if( typeof(both) != 'undefined' && both && prevButton )
			toggleButton( 'prev', false );
		
    }

    function enable( both ){
    	// enable next button if exist
		if( nextButton )
			toggleButton( 'next', true );
		
		// enable back button if exist and both param is true
		if( typeof(both) != 'undefined' && both && prevButton )
			toggleButton( 'prev', true );
    }

    function pause() {
        if(frames['myFrame'].activity) {
        }
        else {
           setTimeout('enable();', 1000);
        }
    }


// wrapper for getting olas 2 variables    
function getOlasConfigValue( key )
{
    // if olas 2 config is null then load it
    if( olas2Config == null )
    {
        var launchConfig = doLMSGetValue("cmi.launch_data");
        
        // recognize olas 2 configuration data
        if( launchConfig.length > 0 &&  launchConfig.substr( 0, 9 ) == 'olas2Mode' )
            olas2Config = eval( '(' + launchConfig.substr( launchConfig.indexOf('{') ) + ')' );
        else
            olas2Config = false;
    }
    
    // if it is false then return false (olas 2 config not available)
    if( olas2Config == false )
        return null;
    
    return eval( 'olas2Config.' + key );
}
    
function initialize() {
	
    // make lesson frame transparent via javascript as W3C validator doesn't allow 'allowTransparency' atribute within iframe tag?!
    $('#myFrame').attr( 'allowTransparency', 'true' );
    
    // show screen navigation bar for developers
    if( developmentMode )
        parent.initDevNavigation( noOfScreens );
    
    nextButton = document.getElementById('next_link');
	
	// detect prev/back navigation button
	var prevButtonImgEl = document.getElementById('prev_link');
	if( prevButtonImgEl )
		prevButton = prevButtonImgEl;
    
	// are you allowed to launch the content - related to test lesson and max attempts
	var blockedContent = false;
	var isItTest = typeof(goodAnswers) != "undefined";
    
	// check limited number of attends for the test
    if( isItTest )
	{
		// we have to initialize LMS
		loadPage();
	
		blockedContent = blockAccess();
	}
        
	// otherwise disable 'next' button for one sec if it is not a test lesson 
	else
		disable();
	
	// if  it is a test lesson and content is blocked, then display the blocked content screen 
	if( blockedContent )
	{
		blockContent();
		return;
	}
	
	// load a screen
    frames['myFrame'].location.href = getContentFolderName() + '/' +currentScreenNo+ '.htm';
	
	// initilize LMS communication if it hasn't been done yet
	if( ! isItTest )
		loadPage();
	
	// track completion if lesson contains only one screen
	if( noOfScreens == 1 && typeof(goodAnswers) == "undefined" )
	{
		onLastScreen();
		submitCompletion();
	}
	
	refreshCounter();
}

/**
 *  Set navigation and display the screen with the message about content being blocked 
 */
function blockContent()
{
	// show stop button
	document.getElementById('next_link').style.display = "none";
	document.getElementById('submit_link').style.display = "none";
	document.getElementById('exit_link').style.display = "";
	onLastScreen();
	
	// set progress bar to 100%
	document.getElementById('progress_bar').style.width = '100%';

	// load the screen with the information that content is blocked
	frames['myFrame'].location.href = getContentFolderName() + '/blocked.htm';
}


/**
 * Returns current no of attempts
 * 
 * @param bool zeroIfEmpty = FALSE return 0 if attempts not set in lms?
 */
function getCurrentTestAttempt( zeroIfEmpty )
{
	var suspendData = doLMSGetValue('cmi.suspend_data');
	if( suspendData.indexOf( ',' ) )
		suspendData = suspendData.split(',')[0];
	
    var currentTestAttempt = parseInt( suspendData );
    
    if( typeof( zeroIfEmpty ) == 'undefined' )
        zeroIfEmpty = false;
    
    if( isNaN( currentTestAttempt ) )
        currentTestAttempt = zeroIfEmpty ? 0 : 1;
    
    return currentTestAttempt;
}

/**
 * Checks if test is not launched more than limited number of times 
 *  @return bool - true if content should be blocked
 */
function blockAccess()
{
	// there is no limit for test attempts
	if( maxTestAttempts == 0 )
		return false;
	
	var currentTestAttempt = getCurrentTestAttempt();
	var newCurrentTestAttempt = currentTestAttempt+1;
	
	// increment the attempts counter
    doLMSSetValue( 'cmi.suspend_data', newCurrentTestAttempt + ',' + maxTestAttempts );
	
	if( currentTestAttempt > maxTestAttempts )
		return true;
	
	return false;
}

function onFrameLoad() {
    pause();
	
	// check and display the message about lesson completion
	showLessonMessage();
	
	// load google translate?
	if( parent.useGoogleTranslate )
	{
		var hasInvisibleWhiteBox = false;
		$( '#whiteBoxWrap, #whiteBox', frames['myFrame'].document ).each( function(){
			if( hasInvisibleWhiteBox )
				return;
			hasInvisibleWhiteBox = $(this).css( 'display' ) === 'none';
		});
		
		// use delay for whitebox activities
		if( hasInvisibleWhiteBox )
			setTimeout( 'loadGoogleTranslate( frames["myFrame"] )', 1700 );
		// no delay in other cases
		else
		{
//			console.log( 'GT no delay' );
			loadGoogleTranslate( frames["myFrame"] );
		}
	}
}

/**
*  Displays message in the right bottom corner of the actual screen
*/
function showLessonMessage()
{
	if( lessonMessage == false )
		return;
		
	// create the message div on the fly
	var endMessage = frames['myFrame'].document.createElement( "div" );
	endMessage.setAttribute( 'id', 'endMessage' );
	
	// set message wording
	endMessage.innerHTML = lessonMessage;
	
	// add message div to body element
	frames['myFrame'].document.body.appendChild( endMessage );
	
	var endMessageDom = frames['myFrame'].document.getElementById('endMessage');
	
	// without it, it won't be displayed?!
	endMessageDom.style.display = 'block';
}

/**
 * check if any screen has been bookmarked and 
 * display popup to ask if user would like to jump to the bookmarked screen
 */
function showBookmarkPopup()
{
	// if LMSFinish signal is sent then do not check bookmark
	if( afterLmsFinish )
		return;
		
	var screenBookmark = doLMSGetValue('cmi.core.lesson_location');
	
	if( screenBookmark.length == 0 )
		return;
	
	var screenBookmarkParts = getLocalTracker( currentLessonNo-1 );
	
	if( screenBookmarkParts.length < 3 && ! screenBookmarkParts.indexOf(':') )
	    return;
	
	var bookmarkedScreen = screenBookmarkParts.split(':')[1];
    
	if( bookmarkedScreen.length == 0 )
	    return;
	
	bookmarkedScreen = parseInt(bookmarkedScreen);
	
    if( bookmarkedScreen > 1 && bookmarkedScreen <= noOfScreens && confirm( loadBookmarkText ) )
        goToBookmark( bookmarkedScreen, 1 );
	
}


/**
 * go to the ceratin screen
 * 
 * must be called from screen iframe
 */
function goToBookmark( screenNo, relatedToLesson )
{
	var folderName = relatedToLesson == 1 ? lessonFolder + '/' : ''
    
    currentScreenNo = screenNo;
	frames['myFrame'].location.href =  folderName + currentScreenNo+ '.htm';
	
	// we need proper actions on the last screen
	if(currentScreenNo == noOfScreens) {
        $('#next_link').attr( 'class', 'navigationButton buttonExit' );
        onLastScreen();
	}

	
	refreshCounter();
}


function getContentFolderName() { // the same as the name of the top file excluding extension
	// check if lessonfolder hasn't been already received
	if( lessonFolder != undefined )
		return lessonFolder;
	
	// otherwise get it from url
	var myUrl = location.pathname;
	myUrlArr = myUrl.split('/');
	myFileName = myUrlArr[myUrlArr.length-1].split('.');
	
	// remember it and also set current lesson number
	lessonFolder = myFileName[0];
	currentLessonNo = myFileName[0].split('_')[0];
	
	return lessonFolder;
}

/**
* go to next screen in course lesson (not for tests)
*/
function goNext( relatedToScreen ) {
	disable();
	if(currentScreenNo < noOfScreens) {
		autobookmark();
		currentScreenNo++;
		var contentFolder = ( typeof(relatedToScreen) != "undefined" && relatedToScreen )
			? ''
			: getContentFolderName() + '/';
		frames['myFrame'].location.href = contentFolder + currentScreenNo+ '.htm';
		//alert("going to screen no: " + currentScreenNo);
		if(currentScreenNo == noOfScreens) {
		    $('#next_link').attr( 'class', 'navigationButton buttonExit' );
			onLastScreen();
			submitCompletion();
		}		
	} else {
		// send completion signal to LMS
		top.close();
	}
	refreshCounter();
}

function onLastScreen()
{
    // reference to stop/exit image
    var stopImgRef = document.getElementById('next_link');

    // check OLAS config
    var olasNextModule = getOlasConfigValue('nextModule');
    
   var isTest = typeof(goodAnswers) != 'undefined';
    var isTestPassed = isTest && getTestScore() >= pass_rate;
    var isLinked = olasNextModule != null && olas2Config.linked == 1;
    var openedInPopup = parent.opener;
    var isItLastLesson = isLastLesson();
    var gotoLinked = isLinked && ( isTestPassed || ( ! isTest && isItLastLesson ) );
    var isSurvey = getOlasConfigValue('linkedType') == 'SV';
	
    // switch exit button to 'next' - it will bring you to the next lesson/linked assessment
    // olas integration
    if( ! isItLastLesson || gotoLinked )
    {
        // net title for forward link
        var newForwardLabel = gotoLinked 
			? endMessageAssessment.replace( /%linked%/g, isSurvey ? congratulationLinkedSurveyHeader : congratulationLinkedAssessmentHeader ) 
			: nextLessonButtonAlt;
        
        // change title/alt
        $('#next_link').attr({
            'title': newForwardLabel,
            'alt': newForwardLabel,        
            'class': 'navigationButton buttonForward'        
        });
        
        // change action
		// single SCO
		if( isSingleSco )
		{
			stopImgRef.href = gotoLinked
				? 'javascript: getApiWindow().launchAssessment(' + ( isSurvey ? '1' : '0' ) + ');'
				: 'javascript: gotoNextModule()';
		}

        // switch exit and next buttons if it is a test lesson
        if( gotoLinked && isTest )
        {
            document.getElementById('exit_link').style.display='none';
            stopImgRef.style.display = ''; 
        }
        
        // set link target to iPlayer or top of popup
        else
            stopImgRef.target = '_parent';
        
        // hide blue message
        lessonMessage = false;
    }
    
    // if course is launched in iframe then replace 'exit' button with 'stop' one
    else if( ! openedInPopup )
    {
        var navButtonEl = isTest ? 'exit_link' : 'next_link'; 
        var navButtonJs, navButtonClass;
        
        // if olas 2 integration then make link close iplayer
        if( olasNextModule != null )
        {
        	var closeAction = getIPlayer() 
        		? 'getIPlayer().end()'  // iplayer
        		: '$( \'#mobileCloseWin a\', parent.parent.document ).get(0).click()'; // mobile view
            navButtonJs = 'javascript:' + closeAction + ';';
            navButtonClass = 'buttonExit';
        }
        
        // otherwise displays just stop button
        else
        {
            navButtonJs = '#';
            navButtonClass = 'buttonStop';
        }
            
        // update button
        $( '#' + navButtonEl ).replaceWith('<a href="' + navButtonJs + '" class="navigationButton ' + navButtonClass + '"></a>');
        
        // singleSCO: remove end message
        //lessonMessage = ( typeof( isLastLesson ) != 'undefined' ) ? endMessageFrame : endMessageiPlayer;
    }
    
    // otherwise it means that course has been launched in popup
    // in this case leave the button js and amend its labels to 'exit' instead of 'next'
    else
    {
        // Set Alt to Exit link/button
        $('#' + ( isTest ? 'exit_link' : 'next_link' ) ).attr({
            alt: exitButtonAlt,
            title: exitButtonAlt
        });
        
        // set end message
        lessonMessage = endMessageFrame;
    }

    //Remove previous link
    prevImgRef = document.getElementById('prev_link');
    if(prevImgRef)
    {
        /*prevImgRef.parentNode.removeAttribute("href");
        prevImgRef.parentNode.removeAttribute("href");
        prevImgRef.parentNode.alt = '';
        prevImgRef.parentNode.removeChild(prevImgRef);   */
        $('#prev_link').remove(); 
    }
}


/**
* update location on each screen and if autobookmarking is on - send it to LMS
*/
function autobookmark()
{
	// get whole course statuses as an array
	var tracker = getLocalTracker();
	
	// get current lesson tracker as an array( <lesson status>:<bookmarked screen no> )
	var lessonTracker = tracker[currentLessonNo-1].split(':');

	// update bookmarked screen within the current lesson tracker array
	lessonTracker[1] = currentScreenNo+1;
	
	// update the tracker for current lesson within global array(all lessons)
	tracker[currentLessonNo-1] = lessonTracker.join(':');
	
	doLMSSetValue("cmi.core.lesson_location", tracker.join( ',' ) );
	
	if( autobookmarking != 0 && currentScreenNo % autobookmarking == 0 )
	    doLMSCommit();
}


/**
* go to prev screen in course lesson (not for tests)
*/
function goPrev() {

	if(currentScreenNo > 1) {
		currentScreenNo--;
		frames['myFrame'].location.href = getContentFolderName() + '/' +currentScreenNo+ '.htm';
		//alert("going to screen no: " + currentScreenNo);
		if(currentScreenNo == noOfScreens -1) {
			document.getElementById('next_link').src = "../../common_images/icon_nex.gif";
		}
	} 
	
	refreshCounter();
}

/*
* go to next screen in course test
*/
function submitAnswer() {
	if(currentScreenNo <= noOfScreens) {
		if(currentAnswer == 0) {
			alert( missingAnswerWarning );
			return;
		} else {
			for (var i = 0; i < goodAnswers.length; i++) {
				if (goodAnswers[i] ==  Base64.encode(currentAnswer)) {
					studentScore++;
				}
			}
			currentAnswer = 0;
			
			if( show_answer == 1 )
				showCorrectAnswer();
		}
		
		// go to the next page if you aren't showing correct answers
		if( show_answer == 0 )
		{
			goToNextQuestion();
		}
		
		// change submit link image to 'next' button
		else
		{
			document.getElementById('submit_link').style.display = "none";
			document.getElementById('next_link').style.display = "";
		}
		
		
	} else {
		top.close();
	}
}

/*
* call to LMS to submit completion
*  callLmsFinish (bool) default TRUE, it will call LMSFinish if true or no param
*/
function submitCompletion( callLmsFinish ) {
	if(typeof(goodAnswers) != "undefined") { // lesson is a test	
		doLMSSetValue("cmi.core.score.raw", getTestScore()); //  
		if(getTestScore() >= pass_rate ) { // pass if sufficient score acheived
			completionStatus = "passed";
			changeLessonStatus( "last", '2' );
		} else { // fail if sufficient score no acheived
			completionStatus = "failed";
			changeLessonStatus( "last", '0' );
		}
	} else {
		// track lesson completion
		changeLessonStatus( "actual", '2' );
		completionStatus = "completed";
	}

	// remember prefered language
	doLMSSetValue("cmi.student_preference.language", getPreferredLanguage() );
	
	// set whole course as finished
	if( completionStatus != 'completed' || isCourseFinished() )
	{
		doLMSSetValue("cmi.core.lesson_status", completionStatus );

		// commit lesson's status to the LMS if argument allows to do it
		// if SCORMStrictMode the do LMSCommit instead of LMSFinish
		if( typeof( callLmsFinish ) == 'undefined' || callLmsFinish )
		    isSCORMStrictMode() ? doLMSCommit() : doLMSFinish();
		
		// enable linked assessment link
		if( completionStatus != 'failed' )
		    enableLinkedAssessment();
	}
	
	// commit SCO state every time when finished non-last module
	else
	    doLMSCommit();
	
	// refresh menu
	refreshCourseMenu();
}


// Returns used langauge folder
function getPreferredLanguage()
{
	// first check agains Google Translate(GT)
	if( parent.useGoogleTranslate )
		return parent.LANG_USE_GT;
	
    var langPref = location.href.match(/lang\/[^\/]+/i);
    
    if( langPref.length == 0 )
        return '';
    
    var lang =langPref[0].split( '/' )[1];
    
    // we cannot return 'eng', because it will be ignored by API CollectData(/app/elements/scorm/scorm_12api.ctp), 
    // which doesn't post values if they are equal to its defaults
    return lang == 'eng' ? 'default' : lang;
    
}


// Detecting SCORMStrictMode
function isSCORMStrictMode()
{
    if( SCORMStrictMode == 'auto' )
        SCORMStrictMode = olas2Config == false; 
    
    return SCORMStrictMode;
}

/*
* course score converted to percent (INT)
*/
function getTestScore() {
	return (studentScore / noOfScreens * 100) | 0; // to cast to integer bitwise operation | 0
}

/*
* called by test, takes value from radio buttons in test forms
*/
function getCurrentAnswer(value) {
	currentAnswer = value;	
}	
/*
* called from summary screen of the test to set appropriate freedback
*/
function getMessage() {
	
    // stores information abouts the button on the summary page
    endButton = {};
    
    if(doLMSGetValue("cmi.core.lesson_status") == "passed") {
		
        // check if course is linked to assessment
        var isLinked = getOlasConfigValue( 'linked' );
    
		// set iPlayer message: linked assessment
		// typeof condition is launched in lesson frame(it's parent is iPlayer)
		if( isLinked == 1 && typeof( getApiWindow().launchAssessment ) != 'undefined' ) 
		{
		    endButton.id = 'linkedAssessment';
		    endButton.icon = 'button_assessment.jpg';
		    var isSurvey = summaryLinkedContentWording();
		    
		    // this callback is called from the screen, so it uses parent.parent to get to the iPlayer frame
		    endButton.onclick = 'parent.getApiWindow().launchAssessment( ' + ( isSurvey ? '1' : '0' ) + ' );';
		}
		
		// set button for printing cert
		else if( isLinked != null )
		{
    		endButton.id = 'printCert';
            endButton.text = endButtonCertDesc;
		}
		
		frames['myFrame'].document.getElementById("message_result").innerHTML = "<span class=message_result_correct >" + congratulationHeader + "</span><p>" + congratulationText.replace( /%score%/, getTestScore() );
		
	} else if(doLMSGetValue("cmi.core.lesson_status") == "failed") {
		frames['myFrame'].document.getElementById("message_result").innerHTML = "<span class=message_result_incorrect>" + sorryHeader + "!</span><p>" + sorryText.replace( /%score%/, getTestScore() ).replace( /%required_score%/, pass_rate ) + "</span>";
		
		endButton.id = 'retake';
		endButton.icon = 'button_retake.png';
	    endButton.label = endButtonRetakeLabel;
	    endButton.onclick = 'retake();';
	    endButton.text = endButtonRetakeDesc;
	    
	}else {
		alert(doLMSGetValue("cmi.core.lesson_status"));
	}
}


/**
 * Setup apropriate linked content wording on summary page
 * 
 * @return bool TRUE if it is linked survey
 */
function summaryLinkedContentWording()
{
    var linked = '';
    var isSurvey = getOlasConfigValue('linkedType') == 'SV';
    
    // linked survey wording
    if( isSurvey )
        linked = congratulationHeader = congratulationLinkedSurveyHeader;
    
    // linked assessment wording
    else
        linked = congratulationHeader = congratulationLinkedAssessmentHeader;
    
    linked = linked.toLowerCase();
    endButton.text = endButton.label = endMessageAssessment.replace( /%linked%/g, linked );
    congratulationText = congratulationLinkedAssessmentText.replace( /%linked%/g, linked );
    
    return isSurvey; 
}

/*
* 
*/
function refreshCounter() {
	if(currentScreenNo > noOfScreens) { // hide on summary screen
		document.getElementById("screen_counter").innerHTML = "";
	} else {//refresh on any othyer screen
		document.getElementById("screen_counter").innerHTML = currentScreenNo + " / " + noOfScreens;
	}
	
	progressBarWidth = (100/ noOfScreens) * currentScreenNo;
	if( progressBarWidth > 100 )
		progressBarWidth = 100;
	document.getElementById('progress_bar').style.width = progressBarWidth + '%';
}

/*
Display correct answers 
*/
function showCorrectAnswer()
{
	for( var i=0; i<frames['myFrame'].document.forms[0].elements.length; i++ )
	{
		answerInput = frames['myFrame'].document.forms[0].elements[i];
		answerNo = i + 1;
		
		if( answerInput.type != 'radio' )
			continue;
			
		if( Base64.encode(answerInput.value) == goodAnswers[currentScreenNo-1] )
		{
			frames['myFrame'].document.getElementById( 'showAnswer' + answerNo ).style.display = '';
		}

		// feature to mark incorrectly selected answer with x (29/06/11)
		else if( answerInput.checked )
		{
			frames['myFrame'].document.getElementById( 'showAnswer' + answerNo ).innerHTML = '<img src="../../../common_images/cancel.png"/>';
			frames['myFrame'].document.getElementById( 'showAnswer' + answerNo ).style.display = '';
		}
		
		answerInput.disabled = true;
	}
	
	 
}


function goToNextQuestion()
{
	if ( currentScreenNo < noOfScreens) {
		currentScreenNo++;
//		frames['myFrame'].location.href = getContentFolderName() + '/' +currentScreenNo+ '.htm';
		frames['myFrame'].location.reload();
		
		if( show_answer == 1 )
		{
			document.getElementById('submit_link').style.display = "";
			document.getElementById('next_link').style.display = "none";
		}
		
	} else {
		frames['myFrame'].location.href = getContentFolderName() + '/summary.htm';
		document.getElementById('next_link').style.display = "none";
		document.getElementById('submit_link').style.display = "none";
		document.getElementById('exit_link').style.display = "";
		onLastScreen();
		
		// don't call lmsFinish yet
		submitCompletion(false);
		
		currentScreenNo++;
	}
	
	refreshCounter();
}


/*
Display question in the table
*/
function  displayQuestion()
{
	question = getQuestion();
	frames['myFrame'].document.getElementById( 'questionText' ).innerHTML = currentScreenNo + '. ' + question.text;
	for( var i=0; i<question.answers.length; i++ )
		displayAnswer( question.answers[i] );
	
	// load google translate?
    if( parent.useGoogleTranslate )
        loadGoogleTranslate( frames["myFrame"] );
}


/**
 * highlights a row in the table
 * @param src Dom ID -  radio button's legend box inside a table cell
 * @param hover bool - odd/even background
 */
function tableRowOver(src, hover)
{ 
	if( typeof( hover ) == 'undefined' )
		hover = false;
	
	var hoverSuffix = hover ? '_hover' : '';
	src.parentNode.parentNode.className = 'answer_row' + hoverSuffix;
}

/*
Display answer in the table
*/
function displayAnswer( answer )
{
	table = frames['myFrame'].document.getElementById('resultsTable');
	newRow = table.insertRow( table.rows.length );
	answerNo = table.rows.length - 1;
	
	newRow.className = 'answer_row';
	
	c1 = newRow.insertCell(0);
	c2 = newRow.insertCell(1);
	
	c1.className = 'cell_radio_answer';
	c2.className = 'cell_answer_text';

	c1.innerHTML = '<div id="showAnswer'+answerNo+'" class="correctAnswer" style="display: none"><img src="../../../common_images/ok.png"/></div><label for=user_answer></label><input onclick="javascript:parent.getCurrentAnswer(value);" class="radio" id=user_answer_'+answerNo+' type="radio" name="user_answer" value="'+answer.id+'">';
	c2.innerHTML = '<label for="user_answer_'+answerNo+'" class="answer_text" onmouseover="parent.tableRowOver(this,true)" onmouseout="parent.tableRowOver(this,false)">'+answer.text+'</label>';
}


/*
Return next question for test
*/
function getQuestion()
{
	if( questionStack.length == 0 )
		initQuestions();

	return questions[ questionStack[currentScreenNo-1] ];
}


/*
Prepare questions for test:
if random select then get random questions but remember about questions which are required
*/
function initQuestions()
{
	// no random selection
	if( random_select == 0 )
	{
		for( i=0; i<goodAnswers.length; i++ )
			questionStack[i] = i;
	}
	
	// pick random questions
	else
	{
		newGoodAnswers = new Array();
		
		// number of random and not required questions to pick
		noOfNotRequiredQuestion = 0; 	
		
		// check how many question we can display
		if( nr_questions_for_display > goodAnswers.length )
			nr_questions_for_display = goodAnswers.length;
			
		// calculate the number of required questions
		noOfRequiredQuestions = 0;
		for( i=0; i<questions.length; i++ )	
			if( questions[i].required )
				noOfRequiredQuestions++;
				
		// calculate number of not required questions we can pick		
		if( noOfRequiredQuestions < nr_questions_for_display )		
			noOfNotRequiredQuestion = nr_questions_for_display - noOfRequiredQuestions;
			
		// prepare array with questions indexes. From this array we will pick indexes	
		questionIndexes = new Array( questions.length );
		for( i=0; i<questions.length; i++ )
			questionIndexes[i] = i;
		
		hasRemovedNotRequiredQuestions = false;	
			
		// pick random questions
		while( questionStack.length < nr_questions_for_display )
		{
			// remove indexes for not required questions if needed
			if( ! hasRemovedNotRequiredQuestions && noOfNotRequiredQuestion <= 0 )
			{
				for( i=0; i<questionIndexes.length; i++ )
					if( ! questions[ questionIndexes[i] ].required )
					{
						questionIndexes.splice( i, 1 );
						
						// after removing row with the certain index we have to check the same index again
						i--;
					}
						
				hasRemovedNotRequiredQuestions = true;				
			}
			
			// pick random number from questionIndexes array range nad remove this row to avoid picking
			// the same number 		
			randomNumber = Math.floor( Math.random() * questionIndexes.length );
			pickedQuestionIndex = questionIndexes[ randomNumber ];
			questionIndexes.splice( randomNumber, 1 );
			
			// add question to question indexes stack
			questionStack.push( pickedQuestionIndex );
			newGoodAnswers.push( goodAnswers[pickedQuestionIndex] );
			
			if( ! questions[pickedQuestionIndex].required )
				noOfNotRequiredQuestion--;
		}
		
		// update order of good answers
		goodAnswers = newGoodAnswers;
	}
	
}

/*
----------------------------------
Internal tracking functionality
----------------------------------
*/

function openLesson(lessonNumber, lessonFile, test) {
	var courseStatuses = getLocalTracker();
	
	if(test) {
		var allCompleted = 0;
		for(var i = 0; i < courseStatuses.length; i = i+1) {
			allCompleted = allCompleted + parseInt(courseStatuses[i].charAt(0));
		}	
		if(allCompleted >= ((courseStatuses.length-1)*2)) {
		    
		    // check if user is allowed to launch test lesson
		    if( ! validateAttemptsLimit() )
		    {
		        refreshCourseMenu();
		        return false;
		    }
		        
		    
			changeLessonStatus(lessonNumber, '1');
			
			// set current lesson properties
		    currentLessonNo = lessonNumber;
			
            // prevent calling LMSFinish through unloadPage()->doQuit()
            window.lessonFrame.exitPageStatus = true;
		    
			window.lessonFrame.location.href = lessonFile; 
			refreshCourseMenu();
		} else {
			alert( window.lessonFrame.prerequisitesMessageiPlayer );
		}
	} else {
		
		// check rerequisites
		if(  checkPrerequisites( lessonNumber, courseStatuses ) )
		{
			changeLessonStatus(lessonNumber, '1');
			
			// set current lesson properties
		    currentLessonNo = lessonNumber;
			
		    // prevent calling LMSFinish through unloadPage()->doQuit()
		    window.lessonFrame.exitPageStatus = true;
		    
			window.lessonFrame.location.href = lessonFile; 
			refreshCourseMenu();
		}
		else
			alert( window.lessonFrame.prerequisitesMessageiPlayer );
	}
	
	return false;
}


function validateAttemptsLimit()
{
    // no attempts limit
    if( maxTestAttempts == 0 )
        return true;
    
    var noOfAttempts = getCurrentTestAttempt();
    
    // 1. too many attempts - allow to launch as it will render
    // 	test with blocked content nessage
	// 2. not the last chance - let it be launched without any warning
    if( noOfAttempts != maxTestAttempts )
        return true;
    
	// if called from lesson frame the we have to retrive message from player frame
	if( typeof( maxAttemptsWarning ) == 'undefined' )
		maxAttemptsWarning = parent.maxAttemptsWarning;
	
	// the last chance - we have to show warning
    var warningMsg = maxAttemptsWarning.replace( /%maxAttempt%/, maxTestAttempts );
    warningMsg = warningMsg.replace( /%currentAttempt%/, noOfAttempts );
    
    return confirm( warningMsg );
}

// checks if lessons are done in order
// return true if lessons are launched in order
function checkPrerequisites( lessonNumber, courseStatuses )
{
	if( lessonNumber == 1 || prerequisitesMode == false )
		return true;
		
	for( var i=0; i<lessonNumber-1; i++ )
		if( parseInt( courseStatuses[i].charAt(0) ) < 2 )
			return false;
	
	return true;
}

function changeLessonStatus(lessonNumber, newStatus) {
	var courseStatuses = getLocalTracker();
	if(lessonNumber == 'actual') lessonNumber = currentLessonNo;
	if(lessonNumber == 'last') lessonNumber = courseStatuses.length;
	var actualStatus = getLessonStatus(lessonNumber);
	if(actualStatus != '2') {
		if(newStatus == 'not attempted') newStatus = 0;
		if(newStatus == 'incomplete') newStatus = 1;
		if(newStatus == 'completed') newStatus = 2;
		if(newStatus == 'passed') newStatus = 2;
		if(newStatus == 'failed') newStatus = 1;
		
		courseStatuses[lessonNumber - 1] = courseStatuses[lessonNumber - 1].setCharAt(0, newStatus);
		
		// don't set new value after LMSfinisch signal
		if( ! getPlayerWindow().frames['lessonFrame'].afterLmsFinish )
		    doLMSSetValue('cmi.core.lesson_location', courseStatuses.join(',') );
	}
}

function getLessonStatus(lessonNumber) {
	return getLocalTracker( lessonNumber - 1 ).charAt(0);
}

function isCourseFinished() {
	var allCompleted = 0;
	var courseStatuses = getLocalTracker();
//	alert("isCourseFinished statuses: " + courseStatuses.join( ',' ) );
	if(courseStatuses !== null) {
		for(var i = 0; i < courseStatuses.length; i = i+1) {
			allCompleted = allCompleted + parseInt(courseStatuses[i].charAt(0));
		}		
		if ((allCompleted >= ((courseStatuses.length) * 2))) {
			return true;
		}
		else {
			return false;
		}
	}
	else {
		return false;
	}
	
}

function getStartLesson() {
	var courseStatuses = getLocalTracker();
	var lessonNoToLaunch = 1;
	for(var i = 0; i < courseStatuses.length; i = i+1) {
		var lessonStatus = parseInt(courseStatuses[i].charAt(0));
		if( lessonStatus == 1 || lessonStatus == 0) {
			if (i < courseStatuses.length) {
			    lessonNoToLaunch = i + 1;
			    break;
			}
			else {
			    lessonNoToLaunch = i;
			    break;
			}
		}
	}
	
	// if there is attempts limit for test lesson, load previous one,
	// as clicking on test, will warn user
	if( maxTestAttempts > 0 && $( "#lesson" + lessonNoToLaunch ).hasClass( "test" ) && getCurrentTestAttempt() == maxTestAttempts )
	    lessonNoToLaunch = lessonNoToLaunch == 1 ? 1 : lessonNoToLaunch - 1; 
	
	return 	lessonNoToLaunch;
}

function initLocalTracker( lessonsCount )
{
	// get location based on which local tracking works
	var lessonLocation = doLMSGetValue('cmi.core.lesson_location');
	
	// remember the no of lessons
	noOfLessons = lessonsCount;
	
	// if location is empty then generate it
	if( lessonLocation.length == 0 )
	{
		for( var i=0; i<lessonsCount; i++ )
			lessonLocation += "0:1,";
		lessonLocation = lessonLocation.substr( 0, lessonLocation.length - 1 );
		doLMSSetValue( "cmi.core.lesson_location", lessonLocation );
		
//		alert("Created lessonLocation=" + lessonLocation );
	}
	
	courseStatuses = lessonLocation.split(',');
	
	// display linked assessment module if available
	showLinkedAssessmentItem();
}

function getLocalTracker( index )
{
	var menu = window.name == "lessonFrame" ? parent : window;
	
	// return certain lesson tracker
	if( typeof(index) != "undefined" )
		return menu.courseStatuses[index];
	
	// return all lessons trackers 
	return menu.courseStatuses;
}


String.prototype.setCharAt = function(index,newChar) {
	if(index > this.length-1) return str;
	return this.substr(0,index) + newChar + this.substr(index+1);
}

function refreshCourseMenu() {
	
    var courseStatuses = getLocalTracker();
	for (var i=0; i < courseStatuses.length; i = i+1)
	{
		var lessonStatus = courseStatuses[i].charAt(0);
		if(lessonStatus == '0') {
			//$('#status-'+(i+1), menuWindow ).html('<img src="../../common_images/not_started.png" alt="Not Started" />');
			getPlayerWindow().$('#lesson'+(i+1) ).addClass('notStarted');
		}
		if(lessonStatus == '1') {
			//menuWindow.$('#status-'+(i+1) ).html('<img src="../../common_images/in_progress.png" alt="In Progress" />');
			getPlayerWindow().$('#lesson'+(i+1) ).addClass('inProgress');
		}
		if(lessonStatus == '2') {
			//menuWindow.$('#status-'+(i+1) ).html('<img src="../../common_images/completed.png" alt="Completed" />');
			getPlayerWindow().$('#lesson'+(i+1) ).addClass('completed');
		}
	}
    
    // remove any currentLesson indicator
    $('.currentItem').remove();

    // add current lesson indicator
    getPlayerWindow().$('#lesson'+(currentLessonNo) ).after('<div class=\'currentItem\'></div>');

}


// enable the link of linked assessment
function enableLinkedAssessment()
{
    // if there is no linked assessment then don't do anything
    if( getOlasConfigValue('linked') != 1 )
        return;
    
    // display normally
    //getPlayerWindow().document.getElementById( 'laRow' ).className = 'center laActive';
    
    // singleSCO: show disabled link if linked assessment
    getPlayerWindow().$( '#lesson-la' ).css('display', 'block');    
}


function getPlayerWindow()
{
    return ( window.name == "lessonFrame" ) ? parent : window;
}

function openLinkedAssessment()
{
	var isSurvey = getOlasConfigValue('linkedType') == 'SV';
    if( ! isCourseFinished() )
    {
        // set proper wording for linked items: ra or survey
        var playerWindow = getPlayerWindow();
        var msg = playerWindow.prerequisitesLinkedAssessmentMessageiPlayer;
        var linked = isSurvey
            ? playerWindow.surveyLabel
            : playerWindow.assessmentLabel;
        alert( msg.replace( /%linked%/g, linked.toLowerCase() ) );
        return false;
    }
    
    getApiWindow().launchAssessment( isSurvey );
    return true;
}

function showLinkedAssessmentItem()
{
    // if there is no linked assessment then don't do anything
    if( getOlasConfigValue('linked') != 1 )
        //return;
        getPlayerWindow().$( '#lesson-la' ).remove();
    
    //document.getElementById( 'laRow' ).className = 'center laInactive';
    //$('#lesson-la').remove();
    
    // singleSCO: show disabled link if linked assessment
    if( getOlasConfigValue('linkedType') == 'SV' )
		lessonTitle = surveyLabel;
	else 
		lessonTitle = assessmentLabel;
	
	
    getPlayerWindow().$( '#lesson-la' ).css('display', 'block').text(lessonTitle);
}

// get iPlayer
function getIPlayer()
{
	// if opened in popup, then it is not an iPlayer
	if( window.opener)
		return false;
	
	// return iPlayer when launched as multi-SCO 	
	if( typeof( parent.parent.fb ) != 'undefined' )
		return parent.parent.fb;
		
	// otherwise it must be single-SCO launch
	else
		return parent.parent.parent.fb;
		
}


// get API main window
function getApiWindow()
{
    // popup launch:
        // SCORM API related to current window(player.html)
        if( window.opener && window.opener.API )
            return window.opener;
        // SCORM API related to lesson frame
        else if( parent.opener && parent.opener.API )
            return parent.opener;
        
    // iPlayer launch:
        // SCORM API related to lesson frame
        else if( parent.parent && parent.parent.API )
            return parent.parent;
        // SCORM API related to iPlayer frame
        else
            return parent;
}

// goes to the next leson within single SCO content
function gotoNextModule()
{
    getPlayerWindow().$( '#lesson' + parseInt( parseInt(currentLessonNo) + 1 ) ).click(); 
}


// check if it is the last non-test module
function isLastLesson()
{
    return currentLessonNo == 'test' || currentLessonNo == getLocalTracker().length;
}


// append js file to document
function addJs( src, document )
{
    e = document.createElement("script");
    e.async = true;
    e.type = "text/javascript";
    e.src = src;
    document.body.appendChild(e);
}

// load google translate(GT) APIs
function loadGoogleTranslate( win, rel )
{
    // load OLAS GT API with appropriate relative link
    if( typeof( rel ) == 'undefined' )
        rel = ( win.name == 'myFrame' ? '../' : '' ) + '../../';
    addJs( rel + "SCOFunctions/googletranslate.js?v=" + getPlayerWindow().GOOGLE_TRANSLATE_VERSION, win.document );
}

// ================= DEVELOPER TOOLS ========================

// generate screen links
function initDevNavigation( screenCount )
{
    // developers tool kit div
    var devBox = $('#developerToolbox');
    
    // clean it from the prev lesson data
    devBox.empty();
    
    // create navigation div
    var navDiv = devBox.append( '<div id="dtScreenNav"></div>' ); 
    
    for( i=1; i<=screenCount;i++ )
        navDiv.append( '<a href="javascript: frames[\'lessonFrame\'].goToBookmark( '+i+',1 );">'+i+'</a> | ' );

    // add close link - doesn't work for some reason?!
    //navDiv.append( '<a title="close" href="javascript: $(\'#dtScreenNav\').toggle();" >X</a>' );
    
    devBox.show();
}