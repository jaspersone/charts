/************************************
* Lotus Charts Functions JS v0.01   *
* July 28, 2012                     *
************************************/

/************************************
* Global Variables  	   	 	    *
************************************/
var TESTING = true;
var MAX_BAR_HEIGHT = 300;
var DEFAULT_MAX_SCALE = 300;
var verticalBarScaleMax; // vertical bar default Y access value (before resize)
var verticalBarIncrement;

var screen_dimensions;
var IS_TOUCH_DEVICE = false;
var MOUSE_COORDS = [0,0]; // tracks user's mouse coordinates [x,y]
var barIsEditable = false;
var coordsOnMouseDown = [0,0];

/************************************
* Screen Information  	   	 	    *
************************************/
// params: none
// return: true if the device has a pixel density greater than or equal to 2, false otherwise
function isRetinaScreen() {
	return window.devicePixelRatio >= 2;
}

//	params: none
//	return: array of integer screen dimensions given as [width, height]
function getScreenDimensions() {
	var dimensions = [$('body').width(), $('body').height()];
	return dimensions;
}

// params: none
// return: true if a touch device is detected, false otherwise
function isTouchDevice() {
    return 'ontouchend' in document;
}

/************************************
* Cookies                           *
************************************/
/*
Notes:
In order for this cookie library to work properly, all cookies
on the site should be set using the setCookie function. This
insures that proper formatting of cookies is set in the document.
If other cookies are being set (or created) without the use of
setCookie, it is possible that they may not appear in the results
from getCookie (because of how a cookies key and value are stored).
*/

// params: name = cookie key, value = cookie value, days = amount of days cookie should last 
// return: none
// behavior: given the name, value, and days, a cookie is set with the expiration of the current
//			 time plus the amount of days passed in as a param.
function setCookie(name, value, days) {
    var expires = '';
    if (days) {
        var expirationDate = new Date();
        expirationDate.setTime(expirationDate.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + expirationDate.toGMTString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
}

// params: name = cookie key
// return: the value of the cookie if it exists, null otherwise
function getCookie(name) {
    var key = name + '=';
    var cookieDict = document.cookie.split(';');
    for (var i = 0; i < cookieDict.length; i++) { 
        var current = cookieDict[i];
        while (current.charAt(0)==' ') { // TODO: refactor this loop, replace with regex
            current = current.substring(1,current.length);
        }
        if (current.indexOf(key) == 0) {
            return current.substring(key.length, current.length);
        }
    }
    return null; // return null if current key is not found
}

// params: name = cookie key
// return: none
// behavior: deletes cookie with key == name by setting its expiration as yesterday
function delCookie(name) {
    setCookie(name, '', -1);
}

/************************************
* Charts General                    *
************************************/
function makeClickableiOS() {
    $(".lotus-charts .pull-tab").click(function() {
        return false;
    });
}

// params: none
// return: none
// behavior: when called, starts updating global array MOUSE_COORDS with current mouse's X and Y
//           position on the screen
function trackCoordinates() {
    $(document).mousemove(function(e) {
        MOUSE_COORDS[1] = e.pageY;
        MOUSE_COORDS[0] = e.pageX;
    });
}

// params: none
// return: array of mouse's X and Y coordinates at the time of the function call
// behavior: instead of returning the global array MOUSE_COORDS, creates a new array of the values
//           from MOUSE_COORDS
function getCurrentCoords() {
    return [MOUSE_COORDS[0], MOUSE_COORDS[1]];
}

// TODO: write documentation
function getNearestPixel(maxPixels, maxChartValue, chartValue) {
    return Math.floor((chartValue / maxChartValue) * maxPixels);
}

// TODO: write documentation
function getNearestValue(maxPixels, maxChartValue, pixel, increment) {
    var percentage = pixel / maxPixels;
    var nearestValueBase = Math.round(maxChartValue * percentage);
    return increment * Math.floor(nearestValueBase / increment); 
}

// params: $chart - a jquery object representing the chart
// return: the current maximum value of the chart
// behavior: the chart should have its max value embedded as the attribute "rel".
//           this function simply returns that value as an integer
function getChartScaleMax($chart) {
    var relValue = $chart.attr("rel");
    return relValue ? parseInt(relValue) : DEFAULT_MAX_SCALE;
}

/************************************
* Horizontal Bar Charts             *
************************************/
// TODO: make variable animation time based upon the width of the bar

function horizontalBarCharts() {
    var animationTime = 1500;
    $(".lotus-charts.horizontal-bar-chart").each(function() {
        var $marker = $(this).find(".chart-marker");
        var $bar    = $(this).find(".fill");
        animateHorizontalBar($marker, $bar, animationTime);
    });
}

function animateHorizontalBar($marker, $bar, animationTime) {
    var fillValue = $bar.attr("rel");
    var valueString = fillValue + "px";
    
    $marker.css("left", "0px");
    $bar.css("width", "0px");

    $marker.animate({left: valueString,}, animationTime, "swing");
    $bar.animate({width: valueString,}, animationTime, "swing");
}

/************************************
* Vertical Bar Charts               *
************************************/
// params: none
// return: none
// behavior: kick off all vertical bar charts functions needed to activate this portion of charts
function verticalBarCharts() {
    if (TESTING) console.log("Vertical Bar Charts Starting");

    verticalBarScaleMax = getChartScaleMax($(".lotus-charts.vertical-bar-chart"));
    verticalBarIncrement = getBestIncrement(verticalBarScaleMax);

    var $pullTabs = $(".lotus-charts.vertical-bar-chart .pull-tab");
    var $currentBar = null; var $active_pull_tab = null; // set up initial Y access scale // don't scroll page when tabs are touched $pullTabs.on("touchmove", false); // Don't fire mouse events if we're dealing with a touch device    
    if (!IS_TOUCH_DEVICE) {
        // this section determines when editing should begin
        $pullTabs.mousedown(function(e) {
            barIsEditable = true;
            $currentBar = $(this).parent();
            coordsOnMouseDown = getCurrentCoords();
            if (TESTING) {
                console.log("Tab touched");
                console.log("Coords on mouse down: " + coordsOnMouseDown);
            }
        });
        
        // detects when editing should stop
        $(document).mouseup(function() {
            if (barIsEditable) {
                if (TESTING) {
                    console.log("Tab released");
                }
                barIsEditable = false;
            }
        });

        $(document).mousemove(function(e) {
            if (barIsEditable) {
                if (TESTING) {
                    console.log("<<<< mousedown && mousemove detected >>>>");
                }
                var currCoords = [e.pageX, e.pageY];
                changeBarValue($currentBar, coordsOnMouseDown, currCoords);
            }
        });
    } else { // beyond this for touch devices
        // add touch related event listeners here
        if (TESTING) {
            console.log("Touch device detected");
        }
        // this section determines when editing should begin
        $pullTabs.bind("touchstart", function(e) {
            barIsEditable = true;
            e.preventDefault();
            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            coordsOnMouseDown[0] = touch.pageX;
            coordsOnMouseDown[1] = touch.pageY;
            if (TESTING) {
                console.log("Tab touched");
                console.log("Coords on touchstart: " + coordsOnMouseDown);
            }
        });
        
        // detects when editing should stop
        $pullTabs.bind("touchend", function() {
            if (barIsEditable) {
                if (TESTING) {
                    console.log("Tab released");
                }
                barIsEditable = false;
            }
        });

        $pullTabs.bind("touchmove", function(e) {
            if (barIsEditable) {
                e.preventDefault();
                var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                var currCoords = [touch.pageX, touch.pageY];

                if (TESTING) {
                    console.log("<<<< touchmove detected >>>>");
                    console.log("     coordinate: " + currCoords);
                    console.log("     currentBar: " + $currentBar);
                    console.log("     coordsOnMouseDown: " + coordsOnMouseDown);
                    console.log("     about to send to changeBarValue");
                }
                changeBarValue($(this).parent(), coordsOnMouseDown, currCoords);
            }
        });
    }
}

function getBestIncrement(maxValue) {
    var power = 2; // TODO: figure out the math
    return power < 0 ? 1 : Math.pow(10, power);  
}

function changeBarValue($bar, initialCoords, currCoords) {
    // lock bar editing until this is function completes
    var initialHeight = ($bar).height();
    var diffX = currCoords[0] - initialCoords[0];
    var diffY = currCoords[1] - initialCoords[1];
    var adjustedY = ($bar).height() - diffY; // subtract b/c bar Y pixels are measured from top to bottom

    var maxChartValue = verticalBarScaleMax;
    var increment = verticalBarIncrement; // this value must be dynamically set later by user

    if (TESTING) {
        console.log("<<<< In changeBarValue >>>>");
        console.log("     initialHeight : " + initialHeight);
        console.log("     adjustedY     : " + adjustedY);
        console.log($bar);
        console.log("     Initial mouse coordinates  : " + initialCoords);
        console.log("     Current mouse coordinates  : " + coordsOnMouseDown);
        console.log("     New adjusted height        : " + adjustedY);
    }

    if (diffY !=0 && adjustedY <= MAX_BAR_HEIGHT && adjustedY >= 0) { 
        if (TESTING) { console.log("Inside changing bar height"); }
        var newHeight = adjustedY + "px";
        ($bar).css("height", newHeight);
        if (!($bar).hasClass('saved')) { ($bar).addClass('saved'); }
        if (adjustedY <= 0) {
            ($bar).removeClass('zero'); // do not add duplicate class
            ($bar).addClass('zero');
        } else {
            ($bar).removeClass('zero');
        }
        // must reset coordsOnMouseDown (consider renaming so this makes more sense)
        coordsOnMouseDown[0] = initialCoords[0] + diffX;
        coordsOnMouseDown[1] = initialCoords[1] + diffY;
    } else {
        var newHeight;
        if (adjustedY <= 0) { // gone below 0
            ($bar).css("height", "0").removeClass('zero').addClass('zero');
        }
        if (adjustedY >= MAX_BAR_HEIGHT) { // gone above max height
            ($bar).css("height", MAX_BAR_HEIGHT + "px");
        }

        // add code for what to do, MAX_BAR_HEIGHT - 10% of height
        
        // add handling for below zero
    }
    if (diffY != 0) {
        // change the value of the label
        var updatedValue = changeLabelValue($bar, maxChartValue, adjustedY, increment);
        if (TESTING) {
            console.log("Value to send to server: " + updatedValue);
        }
    }
}

function changeLabelValue($bar, maxChartValue, currPixel, increment) {
    var value = getNearestValue(MAX_BAR_HEIGHT, maxChartValue, currPixel, increment);
    // don't allow negative values
    value = (value < 0) ? 0 : value;
    
    var $label      = ($bar).children(".bubble-label");
    var $number     = ($label).children('.number');
    var $metric     = ($label).children('.metric');
    
    var normalizedValue;
    var units;

    if (value > 999999999) { // billions
        $metric.html("G");
        $normalizedValue = value / 1000000000;
    } else if (value > 999999) { // millions
        $metric.html("M");
        $normalizedValue = value / 1000000;
    } else if (value > 999) { // thousands
        $metric.html("K");
        normalizedValue = value / 1000;
    } else {
        $metric.html(""); // remove
        normalizedValue = value;
    }

    $number.html(normalizedValue);
    
    return value;
}

/************************************
* Main                              *
************************************/
// Main function calls
$(document).ready(function() {

	// get screen information
    screen_dimensions = getScreenDimensions(); // array [width, height]
    IS_TOUCH_DEVICE = isTouchDevice();

    if (isRetinaScreen()) {
        // load retina assets
    } else {
        // load regular assets
    }

    if (TESTING) { console.log("Initial Screen Dimensions are: " + screen_dimensions); }
	
	// keep screen_dimensions up to date
	window.onresize = function() {
		screen_dimensions = getScreenDimensions();
        if (TESTING) { console.log("New screen dimensions are: " + screen_dimensions); }
	}
	
	// check for internet explorer
    if ($.browser.msie) {
		alert("Hello IE, we meet again.")
	}

    // start tracking mouse coordinates
    if (!IS_TOUCH_DEVICE) {
        trackCoordinates();
    } else {
        // no need to track coordinates on a touch device
        // as they are only updated on touchstart/touchend
        // or touchmove.
        makeClickableiOS();
    }

    // start up horizontal bar charts
    horizontalBarCharts();
 
    // start up vertical bar charts
    verticalBarCharts();
});
