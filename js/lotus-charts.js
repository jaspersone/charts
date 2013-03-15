/************************************
* Lotus Charts Functions JS v0.01   *
* July 28, 2012                     *
************************************/

/************************************
* Global Variables  	   	 	    *
************************************/
var TESTING = true;
var DEBUG   = false;
var AJAX_ON = false;
var MAX_BAR_HEIGHT              = 300; // default in pixels (this can be changed)
var DEFAULT_MAX_SCALE           = 300; // vertical bar default Y access value (before resize)
var DEFAULT_CHART_SEGMENT_WIDTH = 40;
var LOTUS_FRAMES_PER_SECOND     = 30; // for frame count on custom js driven animations
var LOTUS_SPARK_CHART_HEIGHT    = 100;

var verticalBarScaleMax; // maximum size of the chart
var verticalBarIncrement; // the size of the chart increments
var verticalBarMaxValue; // the current maximum bar value within a chart (not the max size of the chart)

var screen_dimensions;
var IS_TOUCH_DEVICE = false;
var MOUSE_COORDS = [0,0]; // tracks user's mouse coordinates [x,y]
var barIsEditable = false;
var coordsOnMouseDown = [0,0];

// TODO: Move this somewhere more permanent
var innerShadowDef = "\
<defs>\
    <filter id='inner-shadow'>\
    <!-- Shadow Offset -->\
    <feOffset dx='0' dy='1'/>\
    <!-- Shadow Blur -->\
    <feGaussianBlur stdDeviation='2' result='offset-blur' />\
    <!-- Invert the drop shadow to create an inner shadow -->\
    <feComposite operator='out' in='SourceGraphic' in2='offset-blur' result='inverse' />\
    <!-- Color & Opacity -->\
    <feFlood flood-color='black' flood-opacity='0.3' result='color' />\
    <!-- Clip color inside shadow -->\
    <feComposite operator='in' in='color' in2='inverse' result='shadow' />\
    <!-- Put shadow over original object -->\
    <feComposite operator='over' in='shadow' in2='SourceGraphic' />\
    </filter>\
</defs>"


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
* Utility Functions                 *
************************************/
// params: callback - a function to call after the settimeout has been expired
//         ms - the amount of milliseconds to listen for another duplicate event before
//              firing the callback function
//         uniqueID - a string that should be unique and used a key to find the specific timeout for
//                    a set of duplicate events
// return: a function that takes the above parameters
// behavior: stops event related queues from building up by only allowing last function call to run 
var debounce = (function() {
    // create new dictionary of timers to be filled later
    var timers = {};
    return function(callback, ms, uniqueID) {
        // if no unique id is given, use default
        if (!uniqueID) {
            uniqueID = "Don't call this twice without a uniqueID, or funky stuff will happen";
        }
        // clear timer if another event with same unique id is found
        if (timers[uniqueID]) {
            clearTimeout(timers[uniqueID]);
        }
        // assign new timer to hit callback function after ms has expired
        timers[uniqueID] = setTimeout(callback, ms);
    };
})();

// params: a - an array or string
// return: a single int or an array composed of ints
// note: if an empty string is passed, or if the string does not
//       convert to an int, this function will return null
function convertToInts(a) {
    if (!(a instanceof Array)) {
        return isNaN(parseInt(a)) ? null : parseInt(a);
    } else {
        for (var i = 0; i < a.length; i++) {
            a[i] = convertToInts(a[i]);
        }
        return a;
    }
}

// params: value - the value of the datapoint which will coordinate with the y value on the chart
//         chartMinValue - the minimum value of the current chart
//         chartMaxValue - the maximum value of the current chart
//         chartHeight - the height of the chart in pixels
// return: an integer representing the proper y offset from the top of the chart (for SVG)
function calculatePixel(value, chartMinValue, chartMaxValue, chartHeight) {
    var position = 0;
    // entire range of the chart
    var totalRange = chartMinValue >= 0 ? chartMaxValue : chartMaxValue - chartMinValue;
    // position of the value relative to the bottom of the chart
    var normalizedPosition = chartMinValue >= 0 ? value : value - chartMinValue;
    position = chartHeight - getNearestPixel(chartHeight, totalRange, normalizedPosition);
    if (TESTING && totalRange < 0) {
        console.log("<<<< In calculatePixel() >>>>");
        console.log("chartMaxValue appears to be less than the chartMinValue in calculatePixel!"); 
        console.log("chartMinValue: " + chartMinValue);
        console.log("chartMaxValue: " + chartMaxValue);
    }
    if (TESTING && DEBUG) {
        console.log("<<<< In calculatePixel() >>>>");
        console.log("Input value:        " + value);
        console.log("chartMinValue:      " + chartMinValue);
        console.log("chartMaxValue:      " + chartMaxValue);
        console.log("chartHeight:        " + chartHeight);
        console.log("totalRange:         " + totalRange);
        console.log("normalizedPosition: " + normalizedPosition);
        console.log("Calculated Value:   " + position);
    }
    return position;
}

// params: parameter - the html tag parameter to get a string for
//         value     - the value to assign to the html parameter
// return: if value is not empty or null, will return the proper
//         html formatted string, else returns the empty string.
function getParameterString(parameter, value) {
    if (value != null && value !== "") {
        return parameter + '="' + value + '"';
    }
    return "";
}

// params: id - a string id name
// return: a string that is formatted as an html id attribute
function getIdString(id) {
    if (id != null && id !== "" && typeof(id) === "string") {
        return getParameterString("id", id) + " ";
    }
    return "";
}
// params: class - a string class name, or set of space seperated class names
// return: a string that is formatted as an html class attribute
function getClassString(className) {
    if (className != null && className !== "" && typeof(className) === "string") {
        return getParameterString("class", className) + " ";
    }
    return "";
}

// params: input - a string that needs to be stripped of its outer most set of quotes
// return: a string stripped of all leading and trailing quotes and whitespace
function stripQuoteMarks(input) {
    input = $.trim(input);
    var openQuote = input[0];
    var closeQuote = input[input.length - 1];

    if (TESTING) {
        if (openQuote != closeQuote) {
            console.log("stripQuoteMarks() : mismatched quotes");
            console.log("open quote found  : " + openQuote);
            console.log("close quote found : " + closeQuote);
        }
    }
    var start = openQuote === "'" || openQuote === '"' ? 1 : 0;
    var end   = closeQuote === "'" || closeQuote === '"' ? input.length - 1 : input.length;
    return input.substring(start, end);
}

// params: collection - a collection of dom objects
//         attrName   - a string of the attribute name you want to filter for
// return: an array of dom objects which have the particular attribute
//         identified by attrName
function filterCollectionForAttr(collection, attrName) {
    var ret = []
    $(collection).each(function() {
        if ($(this).attr(attrName) != undefined) {
            ret.push(this);
        }
    });
    return ret;
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
        while (current.charAt(0)==' ') { 
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
function getCurrentMouseCoords() {
    return [MOUSE_COORDS[0], MOUSE_COORDS[1]];
}

// params: maxPixel      - chart's pixel height
//         maxChartValue - chart's maximum value
//         chartValue    - the value you are looking for the rounded pixel from
// return: a rounded pixel location of the current point based upon the ratio
//         between the chartValue to the maxChartValue
// TODO: NOTE: this does not currently support negative values
function getNearestPixel(maxPixels, maxChartValue, chartValue) {
    return Math.floor((chartValue / maxChartValue) * maxPixels);
}

// TODO: make sure that it doesn't return a value that has more than 1 decimal when converted
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
    var relValue = parseInt($chart.attr("rel"));
    if (isNaN(relValue)) {
        return DEFAULT_MAX_SCALE;
    } else {
        return relValue ? parseInt(relValue) : DEFAULT_MAX_SCALE;
    }
}

// params: $bar - a jquery object of the bar to find the value of
// return: either an integer value of the bar or false if the bar does not exist
// behavior: by calling method with a valid bar, the function attempts to return the rel value, which is
//           where the function expects the $bar to store its value
function getBarValue($bar) {
    return $bar ? parseInt(($bar).attr("rel")) : false;
}

// params: $bar - a jquery object that the user wants to set a value for
//         value - an integer value that will be assigned to the bar
// return: true if the value was assigned, false otherwise
// behavior: setBarValue expects value to be a number, if it is a number it will set the object $bar's rel value
//           equal that number and return true. otherwise it will return false.
// TODO: also update backends in the future
function setBarValue($bar, value) {
    if (isNaN(value)) return false;
    ($bar).attr("rel", value);
    return true;
}

// params: $chart - a jquery object representing the chart
//         newValue - the value to set the chart's new max height
// return: n/a
// behavior: the chart's rel value is changed to match the updated value as well as the
//           global variable verticalBarScaleMax
// TODO: also update the backends in the future
function setChartScaleMax($chart, newValue) {
    verticalBarScaleMax = parseInt(newValue);
    $chart.attr("rel", newValue);
}

// TODO: need to refactor for efficiency
// TODO: write documentation
function getBestIncrement(maxValue, pixels) {
    // get height of the container
    var power = Math.floor(Math.log(maxValue / pixels) / Math.log(10)); // TODO: figure out the math
    return power < 0 ? 1 : Math.pow(10, power);  
}

// TODO: refactor and find a way to make it less like a switch statement
// params: value - a numeric value to normalize
// return: a pair [normalized numeric value (single digit before decimal),
//                 metric (an abbreviation for the units)]
// Normalized value
function normalizeValue(value) {
    var normalizedValue;
    var metric;
    if (value > 999999999999999) { // quadrillion
        metric = "Q";
        normalizedValue = value / 1000000000000000;
    } else if (value > 999999999999) { // trillions
        metric = "T";
        normalizedValue = value / 1000000000000;
    } else if (value > 999999999) { // billions
        metric = "G";
        normalizedValue = value / 1000000000;
    } else if (value > 999999) { // millions
        metric = "M";
        normalizedValue = value / 1000000;
    } else if (value > 999) { // thousands
        metric = "K";
        normalizedValue = value / 1000;
    } else {
        metric = ""; // remove
        normalizedValue = value;
    }
    return [normalizedValue, metric];
}

// params: $chart - chart to rescale
// return: true if chart rescaled, false otherwise
// behavior: checks for elements inside chart with class edited-bar
//           then checks their value to determine if they need to be rescaled
function rescaleChart($chart) {
    // only get the bar that has been edited last
    var $editedBar = ($chart).find(".edited-bar");
    var value = getBarValue($editedBar);
    // after getting a handle on the edited bar remove class edited-bar
    ($editedBar).removeClass("edited-bar");

    // only resize chart if it is necessary
    if (isNaN(value)) {
        return false;
    }

    if (value >= verticalBarScaleMax || (value <= verticalBarMaxValue && verticalBarMaxValue < (.5 * verticalBarScaleMax)) ) {
        doRescale($chart);
        return true;
    }
    return false;
}

// params: $chart - a jQuery object representing the chart that needs to be rescaled
// return: none
// behavior: a helper function for resizeChart(), which makes function calls to
//           calculate charts new scale max, rescales the axis, then resizes the bars
function doRescale($chart) {
    // set new max value
    verticalBarScaleMax = calculateNewMaxChartValue(verticalBarMaxValue);
    // update scale html
    rescaleAxis($chart, verticalBarScaleMax); 
    // update all bars
    resizeBars($chart, verticalBarScaleMax);
}

// TODO: refactor
// params: currValue - an integer representing the largest value inside a chart of multiple bars
// return: an integer representing the closest integer multiple of 10 which bounds the currValue
//         passed to the function.
// behavior: the bounding number returned will only have 1 siginificant leading digit, and the rest
//           of the places will be zeros
function calculateNewMaxChartValue (currValue) {
    var valueString = currValue.toString(); 
    var count = valueString.length - 1;
    var first = parseInt(valueString[0]);
    // return new max value
    var result = (first + 1) * Math.pow(10, count);
    return result > DEFAULT_MAX_SCALE ? result : DEFAULT_MAX_SCALE; 
}

// params: $chart - the jquery object that represents the chart's outer wrapper
//         chartMax - the adjusted max value of the chart
// return: none
function rescaleAxis($chart, chartMax) {
    debounce(function() {
        var $chartScaleSegments = ($chart).find(".chart-scale").children();
        var numSegments = ($chartScaleSegments).length;
        var increment = Math.floor(chartMax / numSegments);
        
        ($chartScaleSegments).each(function(index) {
            var value = chartMax - (index * increment);
            // normalizedArray = [normalized value, units];
            var normalizedArray = normalizeValue(value);

            // set new values
            $(this).children(".lotus-number").html(normalizedArray[0]);
            $(this).children(".lotus-metric").html(normalizedArray[1]);

            if (TESTING && DEBUG) {
                console.log(index + ": " + $(this).html());
                console.log("new value: " + normalizedArray[0] + normalizedArray[1]);
            }
        }); 

        // reset vertical bar increment
        var chartHeight = $(".vertical-bar-chart .chart-slice-window").height()
        verticalBarIncrement = getBestIncrement(verticalBarScaleMax, chartHeight);
    }, 500, "rescale vertical bar access");
}

// params: $chart - the jquery object that represents the chart's outer wrapper
//         chartMax - the adjusted max value of the chart
// return: none
function resizeBars($chart, chartMax) {
    var animationTime = 1000;
    var $chartBars = ($chart).find(".bar");
    ($chartBars).each(function(index) {
        // find new pixel to go to
        var newHeight = getNearestPixel(MAX_BAR_HEIGHT, chartMax, parseInt($(this).attr("rel"))) + "px";
        if (TESTING && DEBUG) {
            console.log("<<<< BAR " + index + " >>>>");
            console.log("Old height: " + $(this).height());
            console.log("new height: " + newHeight);
        }
        // animate to new pixel
        $(this).animate({height: newHeight,}, animationTime, "swing").css("overflow", "visible");
    });

    if (TESTING && DEBUG) {
        console.log("In resizeBars()");
    }
}

/************************************
* Horizontal Bar Charts             *
************************************/
function startHorizontalBarCharts() {
    var animationTime = 1500;
    $(".lotus-charts.horizontal-bar-chart").each(function() {
        animateHorizontalBar($(this), animationTime);
    });
}

// TODO: resizing windows causes outside container to change, but does not change inside
//       bar size
function animateHorizontalBar($chart, animationTime) {
    var $marker = ($chart).find(".chart-marker");
    var $bar    = ($chart).find(".fill");
    var maxPixels =  $bar.parent().width() - 8;
    var maxChartValue = parseInt(($chart).attr("rel"));
    var chartValue = parseInt(($chart).children(".chart-marker-box").attr("rel"));

    var pixelWidth = getNearestPixel(maxPixels, maxChartValue, chartValue);

    var valueString = pixelWidth + "px";
    
    zeroOutBars($chart);

    $marker.animate({left: valueString,}, animationTime, "swing");
    $bar.animate({width: valueString,}, animationTime, "swing");

    if (TESTING && DEBUG) {
        console.log("<<<< In Animate Horizontal Bar >>>>");
        console.log("maxPixels:     " + maxPixels);
        console.log("maxChartValue: " + maxChartValue);
        console.log("chartValue:    " + chartValue);
        console.log("pixelWdith:    " + pixelWidth);
        console.log("valueString:   " + valueString);
    }
}

function zeroOutBars($chart) {
    var $marker = ($chart).find(".chart-marker");
    var $bar    = ($chart).find(".fill");
    $marker.css("left", "0px");
    $bar.css("width", "0px");
}
/************************************
* Vertical Bar Charts               *
************************************/
//warning: this algorithm is potentially O(N^2) and will loop through entire list
//         try to call it sparingly
function findAndAssignMax($listToFindMaxFrom) {
    // reset highest value
    verticalBarMaxValue = -1;
 
    ($listToFindMaxFrom).each(function(index) {
        var currValue = getBarValue($(this));
        if (TESTING && DEBUG) {
            console.log("<<<< In findAndAssignMax() >>>>");
            console.log(" current max value: " + verticalBarMaxValue);
            console.log(" this bar value:    " + currValue);
        }
        if (currValue > verticalBarMaxValue) {
            // clear all other maxes
            clearAllMax($listToFindMaxFrom);
            // assign this one class max
            assignMax($(this));
        }
    });
}

// params: jQuery bar object
// return: none
// behavior: grabs the bar's current value then assigns that as
//           the chart's max value as well as attached a class
//           max to the $bar (for easy finding later)
function assignMax($bar) {
    var currValue = parseInt(($bar).attr("rel"));
    // update highest value
    verticalBarMaxValue = currValue;
    // assign this bar class max
    ($bar).removeClass("max").addClass("max");
}

// params: $listToClear - a jQuery object of the list of bars to clear
// return: none
// behavior: O(n) running time, loops through and removes class "max"
//           from each element in the $listToClear
function clearAllMax($listToClear) {
    ($listToClear).each(function(i) {
        $(this).removeClass("max");
    });
}

// params: none
// return: none
// behavior: kick off all vertical bar charts functions needed to activate this portion of charts
function startVerticalBarCharts() {
    if (TESTING && DEBUG) console.log("Vertical Bar Charts Starting");
    var $chart = $(".lotus-charts.vertical-bar-chart"); 

    // set Max Height
    var $chartWindow = $chart.find(".chart-slice-window");
    MAX_BAR_HEIGHT = $chartWindow.height(); // in pixels

    verticalBarScaleMax = getChartScaleMax($chart);
    var chartHeight = $(".vertical-bar-chart .chart-slice-window").height()
    verticalBarIncrement = getBestIncrement(verticalBarScaleMax, chartHeight);

    // set up initial Y access scale
    // don't scroll page when tabs are touched $pullTabs.on("touchmove", false);
    // Don't fire mouse events if we're dealing with a touch device    
    var $pullTabs = $(".lotus-charts.vertical-bar-chart .pull-tab");
    var $currentBar = null;
   
    // loop through and find highest value and assign it class max
    findAndAssignMax(($chart).find(".bar"));
       
    if (!IS_TOUCH_DEVICE) {
        // this section determines when editing should begin
        $pullTabs.mousedown(function(e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            barIsEditable = true;
            
            // mark as current edited bar
            $currentBar = $(this).parent();
            $currentBar.addClass("edited-bar");

            coordsOnMouseDown = getCurrentMouseCoords();
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

                findAndAssignMax(($chart).find(".bar"));
                // rescale chart
                rescaleChart($chart);
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

            // mark as current edited bar
            $currentBar = $(this).parent();
            $currentBar.addClass("edited-bar");

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
            debounce(function() {
                if (barIsEditable) {
                    if (TESTING) {
                        console.log("Tab released");
                    }

                    findAndAssignMax(($chart).find(".bar"));
                    // rescale chart
                    rescaleChart($chart);
                    barIsEditable = false;
                }
            }, 500, "vertical-bar-chart-pullTabs-touchend");
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
    setupBubbleLabels();
}

function setupBubbleLabels() {
    // opening a bubble label
    $(".bubble-label").click(function() {
        if (!$(this).hasClass("open")) {
            // add value of the rel into input box
            var currency = $(this).find(".lotus-currency").html();
            var $input = $(this).find("input");
            var $bubble = $(this);
            $input.val(currency + $(this).closest(".bar").attr("rel"));
            $bubble.addClass("open");
        }
    });

    // closing a bubble label without saving
    $(".bubble-label").find(".button-cancel").click(function(e) {
        var $bubble = $(this).closest(".bubble-label");
        $bubble.fadeOut(100);
        window.setTimeout(function() {
            $bubble.removeClass("open").fadeIn(100);
        }, 100);
        e.stopPropagation();
    });

    // closing a bubble label with saving
    $(".bubble-label").find(".button-set").click(function(e) {
        var $bubble = $(this).closest(".bubble-label");
        setBubbleLabel($bubble);
        e.stopPropagation();
    });

    // setup listening for enter button
    $(".edit-bubble input").keyup(function(e) {
        var $bubble = $(this).closest(".bubble-label");
        if (e.keyCode == 13) {
           setBubbleLabel($bubble);
        }
    });
}

function setBubbleLabel($bubble) {
    var $bar    = $bubble.closest(".bar");
    var $chart  = $bar.closest(".vertical-bar-chart");
    var value = parseInt($bubble.children(".edit-bubble").children("input").val().replace(/[^0-9\.]+/g, ''));
    // TODO: send value to db
    
    // update bubble label
    updateBubbleLabelFromValue($bubble, value);

    // update bar value
    setBarValue($bar, value);
    if (value > verticalBarScaleMax) {
        $bar.removeClass("edited-bar").addClass("edited-bar");
        findAndAssignMax(($chart).find(".bar"));
        rescaleChart($chart);
    } else {
        findAndAssignMax(($chart).find(".bar"));
        doRescale($chart);
    }
    // marked bubble as to be saved
    if (!($bar).hasClass('saved')) { ($bar).addClass('saved'); }

    $bubble.fadeOut(100);
    window.setTimeout(function() {
        $bubble.removeClass("open").fadeIn(100);
    }, 100);
}

function updateBubbleLabelFromValue($bubble, value) {
    if (value || value === 0) {
        var normalizedValue = normalizeValue(value);
        $bubble.children(".lotus-number").html(normalizedValue[0]);
        $bubble.children(".lotus-metric").html(normalizedValue[1]);
        return true;
    } else {
        return false;
    }
}

function changeBarValue($bar, initialCoords, currCoords) {
    // lock bar editing until this is function completes
    var initialHeight = ($bar).height();
    var diffX = currCoords[0] - initialCoords[0];
    var diffY = currCoords[1] - initialCoords[1];
    var adjustedY = ($bar).height() - diffY; // subtract b/c bar Y pixels are measured from top to bottom

    var maxChartValue = verticalBarScaleMax;
    var increment = verticalBarIncrement; // this value must be dynamically set later by user

    if (TESTING && DEBUG) {
        console.log("<<<< In changeBarValue >>>>");
        console.log("     initialHeight : " + initialHeight);
        console.log("     adjustedY     : " + adjustedY);
        console.log($bar);
        console.log("     Initial mouse coordinates  : " + initialCoords);
        console.log("     Current mouse coordinates  : " + coordsOnMouseDown);
        console.log("     New adjusted height        : " + adjustedY);
    }

    if (diffY !=0 && adjustedY <= MAX_BAR_HEIGHT && adjustedY >= 0) { 
        if (TESTING && DEBUG) { console.log("Inside changing bar height"); }
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
        
        // change the value of the bar's rel
        ($bar).attr("rel", updatedValue);
        
        // if larger than max, assign it to be max
        if (updatedValue > verticalBarMaxValue) {
            findAndAssignMax($(".lotus-charts.vertical-bar-chart").find(".bar"));
        }

        if (TESTING && DEBUG) {
            console.log("Value to send to server: " + updatedValue);
        }
    }
}

function changeLabelValue($bar, maxChartValue, currPixel, increment) {
    var value = getNearestValue(MAX_BAR_HEIGHT, maxChartValue, currPixel, increment);
    // don't allow negative values
    value = (value < 0) ? 0 : value;
    
    var $label      = ($bar).children(".bubble-label");
    var $input      = ($label).children(".edit-bubble").children("input");
    var $number     = ($label).children('.lotus-number');
    var $metric     = ($label).children('.lotus-metric');
    
    var newValues   = normalizeValue(value);
    var normalizedValue = newValues[0];
    var units       = newValues[1];

    // update input value
    $input.val("$" + value);

    // update label value
    $metric.html(units);
    $number.html(normalizedValue);
    
    return value;
}

/************************************
* Line Chart Object                 *
************************************/
var lineChart_blue  = "#6dafe1";
var lineChart_green = "#5bbc19";
var lineChart_circleRadius = "6";
var lineChart_strokeWidth = "2";
var lineChart_firstElemOffset = 50; // space need for labelling y axis at the left
var lineChart_bottomLabelHeight = 60; // space needed for labelling x axis at the bottom

// params: id       - the dom object id name
//         start    - the start date, formatted as a date string (YYYY/MM/DD)
//         end      - the end date, formatted as a date string(YYYY/MM/DD)
//         height   - the height (in px) of the container for the Line Chart
//         segWidth - the distance (in px) between data points on the graph
//         linesIn  - an array of Line objects that represent the data of this chart
// return: creates a new instance of a line chart
function LineChart(id, start, end, height, segWidth, linesIn, parentNode) {
    this.id = id;
    this.parentNode = parentNode ? parentNode : null;
    // Adding start and end dates, format to type date
    if (!(start instanceof Date)) {
        try {
            this.startDate = new Date(Date.parse(start, "yyyy/MM/dd"));
        } catch (e) {
            console.log("********************************************************");
            console.log("There has been an error while trying to parse start date");
            console.log("Start date passed: " + start);
            console.log(e);
            console.log("********************************************************");
        }
    } else {
        this.startDate  = start;
    }
    
    if (!(end instanceof Date)) {
        try {
            this.endDate = new Date(Date.parse(end, "yyyy/MM/dd"));
        } catch (e) {
            console.log("********************************************************");
            console.log("There has been an error while trying to parse end date");
            console.log("End date passed: " + end);
            console.log(e);
            console.log("********************************************************");
        }
    } else {
        this.endDate    = end;
    }

    this.outsideChartHeight = height ? height : MAX_BAR_HEIGHT;
    this.pixelHeight        = this.outsideChartHeight > LOTUS_SPARK_CHART_HEIGHT ? this.outsideChartHeight - lineChart_bottomLabelHeight : this.outsideChartHeight;
    this.segmentPixelWidth  = segWidth ? segWidth : DEFAULT_CHART_SEGMENT_WIDTH;
    this.minValue;
    this.maxValue;
    this.numDataPoints  = 0;
    this.lines          = new Array();

    if (linesIn instanceof Array) {
        for (var n = 0; n < linesIn.length; n++) {
            if (linesIn[n] instanceof Line) {
                this.addLine(linesIn[n]);
            } else {
                if (TESTING && DEBUG) {
                    console.log("In LineChart constructor: passed array of linesIn, where not all elements are lines, failed at index: " + n);
                }
            }
        }
    } else if (linesIn instanceof Line) {
        this.addLine(linesIn);
    } else {
        console.log("LineChart Constructor Error: lines passed is not of type array or Line");
        if (typeof(linesIn) != "undefined") {
            console.log("Type found: " + typeof(linesIn));
        } else {
            console.log("Type found: undefined");
        }
    }
    this.zeroPos = calculatePixel(0, this.minValue, this.maxValue, this.pixelHeight);
}

// params: line - a Line object to be added to a LineChart object
// return: true if adding line was a success, false otherwise
LineChart.prototype.addLine = function(line) {
    if (line instanceof Line) {
        line.parentChart = this;
        
        // if data is not an array, fix it
        if (!(line.data instanceof Array)) {
            if (TESTING && DEBUG) {
                console.log("Line data should have been an array");
            }
            // change line data from string to array of values
            line.data = parseLineData(line.data); 
        }
        
        // add the line
        this.lines.push(line);

        // need to check min and max at this point
        var minMax = getMinMaxFromLine(line);
        console.log("Before calling getNumberOfPoints");
        this.numDataPoints = Math.max(this.numDataPoints, getNumberOfPoints(line));
        console.log("After calling getNumberOfPoints");

        if (minMax.length > 0) {
            this.minValue = this.minValue ? Math.min(this.minValue, minMax[0]) : minMax[0];
            this.maxValue = this.maxValue ? Math.max(this.maxValue, minMax[1]) : minMax[1];
            if (TESTING && DEBUG) {
                console.log("minValue set to: " + this.minValue);
                console.log("maxValue set to: " + this.maxValue);
            }
        } else {
            return false;
        }
        return true;
    } else {
        if (TESTING) {
            console.log("Error while trying to add line, passed line not found to be instance of Line");
            console.log("Line pass is of type: " + typeof(line));
        }
        return false;
    }
}

LineChart.prototype.getLineChartColumns = function() {
    var width = this.segmentPixelWidth;
    var padding = this.segmentPixelWidth > 40 ? 20 : this.segmentPixelWidth / 10;
    var centerOffset = width / 2; // this is used to center align the column to the data
    var innerWidth = this.segmentPixelWidth - (padding * 2);
    var count = this.numDataPoints;
    var result = []
    var widthHeightString = 'width="' + innerWidth + '" height="' + this.pixelHeight + '" />';
    var underscoreString  = 'width="' + innerWidth + '" height="5" />';
    var startLabel = this.pixelHeight + 10;
    var startLabelText = startLabel + 24;
    var startLabelDate = startLabelText + 16;
    
    var dateLabel;
    var labelIncrement = 1; // need to make this dynamic later
    var ldate = this.startDate;
    var month;
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var day;

    if (count) {
        for (var i = 0; i < count; i++) {
            // draw tall column for each point
            var x = lineChart_firstElemOffset - centerOffset + padding + (i * (width));
            result.push('<rect class="column-bg" x="' + x + '" y="0" ' +  widthHeightString);

            // draw label if height is larger than 
            if (this.outsideChartHeight > LOTUS_SPARK_CHART_HEIGHT) {
                // the label line
                month = ldate.getMonth() + 1;
                day   = days[ldate.getDay()];
                dateLabel = day + '<tspan style="font-size:75%;" x="' + x + '" y="' + startLabelDate + '">' + month + "/" + ldate.getDate() + '</tspan>';
                result.push('<rect class="x-label-underscore" x="' + x + '" y="' + startLabel + '"' + underscoreString);
                result.push('<text class="chart-label" x="' + x + '" y="' + startLabelText + '" >' + dateLabel + '</text>');
                ldate.setDate(ldate.getDate() + labelIncrement);
            }
        }
    }
    return result.join('\n');
}

// params: target - the DOM object to append the chart to
// return: none
LineChart.prototype.appendChartTo = function(target) {
    $target = $(target)
    if (TESTING && DEBUG) {
        console.log("<<<< In LineChart.appendChartTo() >>>>");
        console.log("LineChart:     " + this.id);
        console.log("Start Date:    " + this.startDate);
        console.log("End Date:      " + this.endDate);
        console.log("Pixel Height:  " + this.pixelHeight);
        console.log("Segment Width: " + this.segmentPixelWidth);
        console.log("Circle Radius: " + this.radius);
        console.log("Chart Max Val: " + this.maxValue);
        console.log("Chart Min Val: " + this.minValue);
        var l = []
        for (i in this.lines) {
            l.push(this.lines[i].className);
        }
        console.log("Line types:    " + this.lines);
        console.log("Lines:         " + l);
    }
    // build basic chart components
    var basicSVGSettings    = 'xmlns="http://www.w3.org/2000/svg" version="1.1"';
    var chartWidth          = 'width="100%"'; // TODO: make this dynamic based on seg width
    var chartHeight         = 'height="' + this.outsideChartHeight + '"';


    // build opening/closing svg strings
    var openSVGTag =  '<svg ' +
                       getIdString(this.id) + ' ' + 
                       basicSVGSettings + ' ' +
                       chartWidth + ' ' +
                       chartHeight + '>\n' +
                       innerShadowDef + '\n';
    var closeSVGTag = '</svg>\n';

    // build chart bg and labels
    var LABEL_OFFSET = 4;
    var MIN_LABEL_SPACE = getLineChartLabelHeight('chart-label') * 2;

    var chartBG = '<rect class="chart-bg" x="0" y="0" width="100%" height="100%" />';
    var chartNeg = '';
    var chartLabels = '';
    var chartGrids;
    var gridY;
    var labelZeroPos;

    var chartColumns = this.getLineChartColumns();

    // if we have min, max, and pixel height,calculate and draw negative area
    if (this.minValue && this.minValue < 0 && this.maxValue & this.pixelHeight) {
        if (TESTING && DEBUG) {
            console.log("<<<< Drawing negative rectangle >>>>");
            console.log("minValue:    " + this.minValue);
            console.log("maxValue:    " + this.maxValue);
            console.log("pixelHeight: " + this.pixelHeight);
        }
        
        labelZeroPos = this.zeroPos - LABEL_OFFSET;
        // grid lines
        gridY = this.zeroPos / 2;
        // see if there is enough space to worry about a negative splitting line
        if (this.zeroPos / this.pixelHeight < .7 && this.pixelHeight > LOTUS_SPARK_CHART_HEIGHT) {
            var gridYNeg = this.zeroPos + Math.round(((this.pixelHeight - this.zeroPos) / 2));
            var labelNegPos = gridYNeg - LABEL_OFFSET;
            var labelValue = Math.round(this.minValue / 2);
            chartGrids += '<line class="chart-grid" x1="0" x2="100%" y1="' +
                           gridYNeg + '" y2="' + gridYNeg + '" />';
            chartLabels += '<text class="chart-label" x="4" y="' + labelNegPos + '">' +
                            labelValue + '</text>';
        }

        var h = this.pixelHeight - this.zeroPos; 
        chartNeg = '<rect class="chart-neg-bg" filter="url(#inner-shadow)" x="0" y="' +
                    this.zeroPos + '" width="100%" height="' + h + 'px" />';
    } else {
        gridY = Math.round(this.pixelHeight / 2);
        labelZeroPos = this.pixelHeight - LABEL_OFFSET;
    }
    
    // only draw positive half line if the positive portion of the chart
    // takes more than 30% of the chart's space
    if (this.zeroPos / this.pixelHeight > .3 && this.pixelHeight > LOTUS_SPARK_CHART_HEIGHT) {
        var labelPos = gridY - LABEL_OFFSET;
        var labelValue = Math.round(this.maxValue / 2);
        chartGrids += '<line class="chart-grid" x1="0" x2="100%" y1="' +
                       gridY + '" y2="' + gridY + '" />';

        chartLabels += '<text class="chart-label" x="4" y="' + labelPos + '">' +
                        labelValue + '</text>';
    }
    // always draw the top line
     chartGrids += '<line class="chart-grid" x1="0" x2="100%" y1="0" y2="0" />';
    // always draw/label the zero line
    chartGrids += '<line class="chart-grid" x1="0" x2="100%" y1="' +
                    this.pixelHeight + '" y2="' + this.pixelHeight + '" />';
    chartLabels += '<text class="chart-label" x="4" y="' + labelZeroPos + '">0</text>';

    
    // label min if there is enough space to do so
    if (this.pixelHeight - this.zeroPos > MIN_LABEL_SPACE) {
        var lineHeight = this.pixelHeight - LABEL_OFFSET; 
        chartLabels += '<text class="chart-label" x="' + LABEL_OFFSET + '" y="' +
                        lineHeight + '">' + this.minValue + '</text>';
    }
    // TODO: see if there is a better way to do this
    //       because LABEL_OFFSET may not match user's desired margin
    // label max if there is enough space to do so
    if (this.zeroPos > MIN_LABEL_SPACE) {
        // get height
        var tempHeight = getLineChartLabelHeight('chart-label'); 
        var lineHeight = LABEL_OFFSET + tempHeight;

        chartLabels += '<text class="chart-label" x="' + LABEL_OFFSET + '" y="' +
                        lineHeight + '">' + this.maxValue + '</text>';
    }

    // build chart body
    var chartBody = [chartBG, chartNeg, chartColumns, chartGrids, chartLabels];
    for (var i = 0; i < this.lines.length; i++) {
        var lineString = this.lines[i].getLineString();
        chartBody.push('<g class="group-' + i + '">' +lineString + "</g>");
    }
    if (TESTING && DEBUG) console.log("<<<< After lines loop >>>>");
    chartBody = chartBody.join('\n') + '\n';
    // build chart string
    var chartString = openSVGTag + chartBody + closeSVGTag;
    $target.append(chartString);
}

/************************************
* Line Chart Static Functions       *
************************************/
function startLineCharts() {
    if (TESTING && DEBUG) { console.log("<<<< Line Charts Starting >>>>"); }
    var lineCharts = getLineCharts();
    
    for (var i = 0; i < lineCharts.length; i++) {
        lineCharts[i].appendChartTo(lineCharts[i].parentNode);    
    }
    //$lineCharts = getLineChartsFromID('line-chart-set-01');
    //console.log($lineCharts);
    animateLineCharts(1200);
}

// params: duration - the total animation time in milliseconds
// return: none
// behavior: finds LineCharts, and animates them from zero position to chart values
function animateLineCharts(duration) {
    if (TESTING && DEBUG) {
        console.log("<<<< Line Chart animation starting >>>>");
    }
    var lines = [];
    var linesTweenStrings = [];
    var circles = [];
    var circlesTweenStrings = [];
    $("svg").each(function() {
        $(this).find("polyline").each(function() {
            lines.push(this);
        });
        $(this).find("circle").each(function() {
            circles.push(this); 
        });
    });

    if (TESTING && DEBUG) { 
        console.log("~~~~ Amount of lines found ~~~~");
        console.log(lines.length);
    }

    // reset all lines to zero position and collect tween data
    $(lines).each(function() {
        var from = $(this).attr("data-from");
        var to   = $(this).attr("data-to");
        if (from && to) {
            if (TESTING && DEBUG) {
                console.log("Found attr 'data-from':" + from);
                console.log("Found attr 'data-to':  " + to);
            }
            $(this).attr("points", from);
        } else {
            if (TESTING) {
                console.log("Cannot find attr 'data-from' and 'data-to'");
                console.log(this);
            }
        }
        // get animation values for lines, if no from or to, will add null
        linesTweenStrings.push(getTweenValues(from, to, duration));
    });
    
    if (TESTING && DEBUG) { 
        console.log("~~~~ Amount of circles found ~~~~");
        console.log(circles.length);
    }

    // reset all circles to zero position and collect tween data
    $(circles).each(function() {
        var from = $(this).attr("data-from");
        var to   = $(this).attr("data-to");
        if (from && to) {
            if (TESTING && DEBUG) {
                console.log("Found attr 'data-from':" + from);
                console.log("Found attr 'data-to':  " + to);
            }
            $(this).attr("cy", from);
        } else {
            if (TESTING) {
                console.log("Cannot find attr 'data-from' and 'data-to'");
                console.log(this);
            }
        }
        // get animation values for circles, if no from or to, will add null
        circlesTweenStrings.push(getTweenValues(from, to, duration));
    });

    // check length of lines and circles
    if (lines.length != linesTweenStrings.length ||
        circles.length != circlesTweenStrings.length) {
        if (TESTING) {
            console.log("ERROR in animateLineChart(): lines and circles do not match\
                         length of linesTweenStrings and circlesTweenStrings");
        }
    } else { // start animations
        var sTime = Date.now();
        $(lines).each(function(i) {
            animatePolyline($(this), linesTweenStrings[i]);
        });
        var eTime = Date.now();
        var lagtime = (eTime - sTime) * 2;
        if (TESTING && DEBUG) {
            console.log(":::::::::::::::::::::::::::::::::::::");
            console.log("Lagtime to add: " + lagtime);
            console.log(":::::::::::::::::::::::::::::::::::::");
        }
        $(circles).each(function(i) {
            animateCircle($(this), circlesTweenStrings[i], lagtime);
        });
    }
}

function animatePolyline(line, points) {
    var timeout = 1000 / LOTUS_FRAMES_PER_SECOND;

    if (points) {
        $(points).each(function(i) {
            var point = this;
            if (this) {
                window.setTimeout(function() {
                    $(line).attr("points", point);
                }, timeout * (i + 1), point);
            }
        });
    } else {
        if (TESTING) {
            console.log("In animatePolyline: points passed is null");
        }
    }
}


function animateCircle(circle, cys, lagtime) {
    var timeout = 1000 / LOTUS_FRAMES_PER_SECOND;
    if (cys) {
        $(cys).each(function(i) {
            var cy = this;
            if (this) {
                window.setTimeout(function() {
                    $(circle).attr("cy", cy);
                }, (timeout * (i + 1) - lagtime) >= 0 ? (timeout * (i + 1) - lagtime) : (timeout * (i + 1)), cy);
            }
        });
    } else {
        if (TESTING) {
            console.log("In animateCircle: points passed is null");
        }
    }

}

// params: none
// return: an array of LineCharts
// goes through dom and finds all line charts and creates object
// representation of them
function getLineCharts() {
    // get charts from all
    var charts = []
    $(".lotus-charts.line-chart").each(function() {
        var data = $(this).attr('rel');
        if (data) {
            if (TESTING && DEBUG) {
                console.log("getLineCharts() - Found a LineChart section with data");
                console.log("data: " + data);
            }
            var dict = parseData(data);
            
            if (dict) {
                // grab local copies of standard values from dict
                var id          = dict["ID"];
                var start       = dict["START"];
                var end         = dict["END"];
                var height      = dict["HEIGHT"];
                var segWidth    = dict["INCREMENT"];
                var radius      = dict["RADIUS"];
                // remove standard values from dict
                delete dict["ID"];       
                delete dict["START"];    
                delete dict["END"];      
                delete dict["WIDTH"];
                delete dict["HEIGHT"];
                delete dict["INCREMENT"];
                delete dict["RADIUS"];

                // get lines from remaining items in dict
                var linesIn = []
                var keys = Object.keys(dict);

                var idName;
                var className;
                var data;

                for (k in keys) {
                    idName = "line-" + k;
                    if (id) {
                        idName = id + "-" + idName;
                    }
                    className = keys[k];
                    data = dict[className];
                    var ln = new Line(null, idName, className, data, radius);
                    if (TESTING && DEBUG) {
                        console.log("  << PUSHING LINE: " + ln.className + " " + ln.data + " >>");
                    }
                    linesIn.push(ln); 
                }

                if (TESTING && DEBUG) {
                    console.log("<<<< ADDING KEYS: " + keys + " >>>>");
                    console.log("  << linesIn contains: " + linesIn.length + " lines >>");
                }

                var lc = new LineChart(id, start, end, height, segWidth, linesIn, $(this));
                charts.push(lc);
            } else {
                if (TESTING) {
                    console.log("Could not parse data");
                }
            }
        }
    });
    return charts;
}

// params: data - a string which is formatted as follows:
//
//  [
//    {'ID'               :'line-graph-02'},
//    {'START'            :'1980/11/24'},
//    {'END'              :'2012/12/14'},
//    {'WIDTH'            :'100%'},
//    {'HEIGHT'           :'400'},
//    {'INCREMENT'        :'50'},
//    {'RADIUS'           :'6'},
// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< everything below would be custom lines
//                                              with the keys being the line's class name
//    {'cost'             :'20 50'},
//    {'projected-cost'   :'(2) 50 30'},
//    {'revenue'          :'120 150'},
//    {'projected-revenue':'(2) 150 130'},
//  ]
//
// return: a dictionary with all elements to the left of the colon as keys
//         and their associated values to the right of the colon.
function parseData(data) {
    // create dictionary object to hold kv pairs
    var dict = {};
    var pair;
    var key;
    var value;

    if (!data) {
        return dict;
    }

    // get rid of white space
    var input = $.trim(data);
    // ensure data begins and ends with "[" and "]"
    if (input[0] != "[" && input[input.length - 1] != "]") {
        if (TESTING) {
            console.log("parseData() : input passed is not formatted properly");
            console.log("input:\n" + data);
        }
        return null;
    }
    // remove "[]" and external white space, then split on commas
    // note at this point, input is no longer a string, but an array of strings
    input = ($.trim(input.substring(1, input.length - 1))).split(","); 

    // clean up any newlines, extra spaces, and "{}"
    for (i in input) {
        // validate input
        input[i] = $.trim(input[i]);
        if (input[i].length > 0) {
            if (input[i][0] != "{" && input[i][input.length - 1] != "}") {
                if (TESTING) {
                    console.log("parseData() : input passed in not formatted properly");
                    console.log("              in set " + i + ". Expected to find '{}'");
                    console.log("input: " + input[i]);
                }
                return null;
            }

            // if input is ok, trim off the {}
            pair = input[i].substring(1, input[i].length - 1).split(":");
            // validate kv pair
            if (pair.length != 2) {
                if (TESTING) {
                    console.log("parseData() : input passed in not formatted properly");
                    console.log("              was expecting a key value pair separated by a ':'");
                    console.log("input: " + input[i]);
                }
                return null;
            }
            key   = stripQuoteMarks($.trim(pair[0]));
            value = stripQuoteMarks($.trim(pair[1]));
            // add sanitized kv pair into the dictionary
            if (TESTING) {
                if (dict[key]) {
                    console.log("Found a duplicate entry for: " + key);
                    console.log("Proceeding by overwritting previous entry.");
                }
            }
            dict[key] = value;
        }
    }

    return dict;
}



// params: parentNodeID - the id name of the parent node to search from
// return: a jquery array of svg node's rel values, these will be used to
//         construct automatically generated svg charts
function getLineChartsFromID(parentNodeID) {
    return filterCollectionForAttr($('#' + parentNodeID).children('svg'), 'rel');
}

// params: className - the className that identifies the label type
// return: an integer that represents the label height
// this function depends on the fact that the label size will be
// determined either by the body 'font-size' css property or the
// <text class="className" ...> 'font-size' properly
function getLineChartLabelHeight(className) {
    // get height
    var $temp = $('<text class="' + className + '" x="0" y="0"></text>');
    var tempHeight = parseInt($temp.css('font-size')) ? parseInt($temp.css('font-size')) : parseInt($('body').css('font-size')); 
    delete $temp;
    return tempHeight;
}

// params: chart - the parent chart that the line data belongs to
//         data  - an array representation of the line data
// return: the calculated points, based upon the chart dimensions
function formatLineData(chart, data) {
    if (!(data instanceof Array)) {
        if (TESTING) {
            console.log("!!!! FOUND AN LINE WITH DATA NOT REPRESENTED AS AN ARRAY !!!!");
        }
        return null;
    }
    var chartMinValue = chart.minValue;
    var chartMaxValue = chart.maxValue;
    var chartHeight   = chart.pixelHeight;
    var segWidth      = chart.segmentPixelWidth;
    var points        = [];
    var offset        = 0;
    var value;
    var y; 
    for (i = 0; i < data.length; i++) {
        value = data[i];
        // check for offset values found in parens ex: (4) means to start
        // the line 4 segments in
        if (value[0] === "(" || value[0] === "[" || value[0] === "{") {
            // note subtract and extra 1 from the length to make up for
            // i offset by his additional piece of information
            // subtract another 1 for the place taken by the offset value
            // total subtraction should be 2
            offset = (parseInt(value.replace(new RegExp(/[^\d]/g), "")) - 2) * segWidth;
            if (TESTING && DEBUG) {
                console.log("<<<< FINDING OFFSET >>>>");
                console.log("  Original value:         " + value);
                console.log("  Found an offset amount: " + offset);
            }
        } else {
            y = calculatePixel(value, chartMinValue, chartMaxValue, chartHeight);
            points.push((segWidth * i + lineChart_firstElemOffset + offset).toString() + "," + y.toString());
        }
    }
    if (TESTING && DEBUG) {
        console.log("chartMinValue: " + chartMinValue);
        console.log("chartMaxValue: " + chartMaxValue);
        console.log("ChartHeight:   " + chartHeight);
        console.log("segWidth:      " + segWidth);
        console.log("Points: " + points);
    }
    return points;
}

// TODO: document
function formatZeroLineData(chart, data) {
    if (!(data instanceof Array)) {
        if (TESTING) {
            console.log("!!!! FOUND AN LINE WITH DATA NOT REPRESENTED AS AN ARRAY !!!!");
        }
        return null;
    }
    var chartMinValue = chart.minValue;
    var chartMaxValue = chart.maxValue;
    var chartHeight   = chart.pixelHeight;
    var segWidth      = chart.segmentPixelWidth;
    var zeroP         = chart.zeroPos;
    var points        = [];
    var offset        = 0;
    var value;
    for (i = 0; i < data.length; i++) {
        value = data[i];
        if (value[0] === "(" || value[0] === "[" || value[0] === "{") {
            // note subtract and extra 1 from the length to make up for
            // i offset by his additional piece of information
            // subtract another 1 for the place taken by the offset value
            // total subtraction should be 2
            offset = (parseInt(value.replace(new RegExp(/[^\d]/g), "")) - 2) * segWidth;
            if (TESTING && DEBUG) {
                console.log("<<<< FINDING OFFSET >>>>");
                console.log("  Original value:         " + value);
                console.log("  Found an offset amount: " + offset);
            }
        } else {
            points.push((segWidth * i + lineChart_firstElemOffset + offset).toString() + "," + zeroP.toString());
        }
    }
    if (TESTING && DEBUG) {
        console.log("chartMinValue: " + chartMinValue);
        console.log("chartMaxValue: " + chartMaxValue);
        console.log("ChartHeight:   " + chartHeight);
        console.log("segWidth:      " + segWidth);
        console.log("Points: " + points);
    }
    return points;
}

/************************************
* Line Object                       *
************************************/
// params: parent - a LineChart object that owns this line
//         idName - the unique ID of this line (used for reference
//         className - a class name to assign to this line for styling
//         data - a string representation of the data points for this line
function Line(parentChart, idName, className, data, radius) {
    this.parentChart= parentChart ? parentChart : null;
    this.idName     = idName      ? idName      : null;
    this.className  = className   ? className   : null;
    this.data       = data && (data instanceof Array) ? data : parseLineData(data);
    this.circleRadius = radius    ? radius      : lineChart_circleRadius; 
    this.values     = this.data   ? getLineValues(this.data) : null;
}

Line.prototype.getLineString = function() {
    var myId        = getIdString(this.idName);
    var myClass     = getClassString(this.className);
    var rawPoints   = formatLineData(this.parentChart, this.data);
    var rawZeroPoints = formatZeroLineData(this.parentChart, this.data);
    var points      = rawPoints.join(' ');
    var zeroPoints  = rawZeroPoints.join(' ');

    // TODO: FIX THIS SECTION TO HAVE POINTS START OUT AT zeroPoints and then move to points
    var lineString  = ['<polyline fill="none" ' + myId + myClass + 'points="' + points + '" data-from="' + zeroPoints + '" data-to="' + points  + '" />']
   
    if (TESTING && DEBUG) {
        console.log("<<<< Getting raw points >>>>");
        console.log("passing data:");
        console.log(this.data);
        console.log("raw points:");
        console.log(rawPoints);
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        console.log("rawPoints:         " + rawPoints);
        console.log("rawPoints length:  " + rawPoints.length);
        console.log("typeof(rawPoints): " + typeof(rawPoints));
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    }
    
    // if the chart is to small (spark chart size), do not add circles
    if(this.parentChart.pixelHeight > LOTUS_SPARK_CHART_HEIGHT) {
        for (var i = 0; i < rawPoints.length; i++) {
            value       = this.values[i];
            coords      = rawPoints[i].split(",");
            zeroCoords  = rawZeroPoints[i].split(",");
            lineString.push('<g class="line-chart-data">');
            lineString.push('<title>' + value + '</title>');
            lineString.push('<circle ' + myClass + 'cx="' + $.trim(coords[0]) + '" ' + 'cy="' + $.trim(coords[1]) + '" ' + 'r="' + this.circleRadius + '" data-from="' + $.trim(zeroCoords[1]) + '" data-to="' + $.trim(coords[1]) + '" data-value="' + value + '" />');
            lineString.push('</g>');
        }
    } else {
        if (TESTING && DEBUG) {
            console.log("The current chart is a spark chart");
            console.log("Will not draw circles");
        }
    }
     
    return lineString.join("\n");
}

/************************************
* Line Object Static Functions      *
************************************/
// TODO: write some tests
// params: dataString - a string which holds the unparsed data for a line
// return: an array of data points for a Line object
function parseLineData(dataString) {
    // change line data from string to array of values
    if (!dataString) {
        if (TESTING) {
            console.log("In parseLineData() : passed dataString is null or undefined");
            console.log("Returning null.");
        }
        return null;
    }
    var temp = dataString.split(new RegExp("\\s+"));
    var data = [];
    var curr;
    console.log("**************************");
    console.log("In parseLineData");
    console.log("**************************");
    for (var i = 0; i < temp.length; i++) {
        curr = $.trim(temp[i]); 
        console.log(curr);
        if (curr !== "") { // in js "" == 0 -> true
            // parseInt(curr) handles the case for offset values such as '(4)'
            // which should be left as strings instead of being converted
            if (!isNaN(parseInt(curr))) {
                curr = parseInt(curr);
            }
            data.push(curr);
        }
    }
    console.log("**************************");
    return data; 
}  

// params: data - an array of point raw point data, it may contain offset
//                values that are wrapped in parens
// return: array of the values excluding offsets
function getLineValues(data) {
    var values = [];
    if (data) {
        for (var i = 0; i < data.length; i++) {
            if (!isNaN((parseInt(data[i])))) {
                values.push(parseInt(data[i]));
            }
        }
    }
    return values;
}

// params: line - a Line object that contains data points
// return: a count of the total number of data points
function getNumberOfPoints(line) {
    var len = 0;
    if (line.data instanceof Array) {
        // check and see if the first value is an offset number
        for (var i = 0; i < line.data.length; i++) {
            if (isNaN(parseInt(line.data[i]))) {
                offset = parseInt(line.data[i].replace(new RegExp(/[^\d]/g), ""));
                if (!isNaN(offset)) {
                    len += offset - 1; // for the duplicated value to connect the lines
                }
            } else {
                len++;
            }
        }
    } else {
        console.log("COULD NOT FIND LINE ARRAY");
    }
    console.log("====================================");
    console.log("This line has " + len + " points.");
    console.log("====================================");
    return len;
}

// params: line - a Line object that contains data points
// return: a tuple array that contains the [min, max] int values
function getMinMaxFromLine(line) {
    var result = [];
    if (line.data.length > 0) {
        var localMin;
        var localMax;
        var index = 0;
        // check to see if there is an offset value for first of array
        // and ignore it if you find one
        if (line.data[index][0] == "(") {
            if (line.data.length > 1) {
                index++;
            }
        }
        // set initial min/max value to the first element's value
        localMin = parseInt(line.data[index]);
        localMax = parseInt(line.data[index]);
        // find local min and max
        for (index; index < line.data.length; index++) {
           localMin = Math.min(localMin, line.data[index]);
           localMax = Math.max(localMax, line.data[index]);
        }

        // adjust min/max to have an additional 10% padding above and below 
        var range = localMax - localMin;
        var padding = Math.round(range / 10);
        result.push(localMin >= 0 ? localMin : localMin - padding);
        result.push(localMax + padding);
    }
    return result;
}


/************************************
* SVG Animation                     *
************************************/
// params: from - a string representation of the from pixel values that
//                the chart starts at
//         to   - a string representation of the to pixel values that the 
//                chart ends at
//         duration - the time in milliseconds for the animation to occur
// return: an array of the tween values
// TODO: fix this function, currently returning wrong values
function getTweenValues(from, to, duration) {
    if (TESTING && DEBUG) {
        console.log("<<<< In getTweenValues() >>>>");
        console.log("Frames per sec: " + LOTUS_FRAMES_PER_SECOND);
        console.log("From values:    " + from);
        console.log("To values:      " + to);
        console.log("Duration:       " + duration);
    }

    // sanity check
    if (!from || !to) {
        if (TESTING && DEBUG) {
            console.log("!!!! ERROR In getTweenValues: must provide values for both from and to !!!!");
        }
        return null;
    } else {
        // type checking
        if (typeof(from) != typeof(to)) {
            if (TESTING && DEBUG) {
                console.log("!!!! ERROR In getTweenValues: mismatched types, 'from' and 'to' not the same !!!!");
                console.log("from type: " + typeof(from));
                console.log("to type:   " + typeof(to));
            }
            return null;
        }
    }

    // calculate total animation frames to make for duration
    // NOTE: duration should be given in milliseconds
    var frameCount = Math.round((LOTUS_FRAMES_PER_SECOND) * duration / 1000);
    // make sure it is an odd number
    if (frameCount % 2 === 0) {
        frameCount++;
    }

    // send tweenFunction as an array of length 1 or 2
    // if the array is of length two, it will divide the
    // tween in half and apply the first tween type for
    // the first half and apply the second tween to the
    // second half.
    // options (linearTween, easeInTween, easeOutTween)
    var tweenFuncs = [easeInTween, easeOutTween]

    // make sure there is no white space
    from = $.trim(from);
    to   = $.trim(to);
    
    // split on spaces
    var _from = $.trim(from).split(new RegExp("\\s+"));
    var _to   = $.trim(to).split(new RegExp("\\s+"));
 
    // dealing with simple single number values
    if (_from.length === 1 && _to.length === 1) {
        // this is the simple case for a single value, istead of pairs
        return getTweenValuesFromTo(tweenFuncs, parseInt(from), parseInt(to), frameCount);
    } else { // dealing with values that are multiple numbers or pairs
        // Prepare arrays
        // strip out blank array elements
        from = [];
        var elem;
        for (var i = 0; i < _from.length; i++) {
            elem = $.trim(_from[i]);
            if (elem !== "") {
                from.push(elem);
            }
        }
        to = [];
        for (var i = 0; i < _to.length; i++) {
            elem = $.trim(_to[i]);
            if (elem !== "") {
                to.push(elem);
            }
        }
        // make sure that 'from' and 'to' are same length
        if (from.length != to.length) {
            if (TESTING) {
                console.log("!!!! ERROR In getTweenValues: 'from' and 'to' must be of same length !!!!");
                console.log("from: " + from);
                console.log("to:   " + to);
            }
            return null;
        }
        // make sure that 'from' and 'to' have elements
        if (from.length < 1 && to.length < 1) {
            if (TESTING) {
                console.log("!!!! ERROR In getTweenValues: 'from' and 'to' must have values !!!!");
                console.log("from: " + from);
                console.log("to:   " + to);
            }
            return null;
        }
        // from and to are of same length and have elements, now in array form
        // check for commas, which represent x,y pairs
        var hasCommas = from[0].split(",").length > 1;
        if (!hasCommas) {
            return getValuesRecursive(tweenFuncs, from, to, frameCount);
        } else { // looking for pairs
            var columns = [];
            // 0,332 50,332 100,332 150,332 200,332 250,332 300,332 350,332 400,332 450,332
            // 0,89  50,170 100,190 150,231 200,120 250,231 300,372 350,281 400,302 450,271
            // loop through each pair and get tween values
            for (var i = 0; i < from.length; i++) {
                var frXY = from[i].split(",");
                var toXY = to[i].split(",");
                
                var frX = parseInt($.trim(frXY[0]));
                var toX = parseInt($.trim(toXY[0]));
                var frY = parseInt($.trim(frXY[1]));
                var toY = parseInt($.trim(toXY[1]));
                
                var xTweenVals = getTweenValuesFromTo(tweenFuncs, frX, toX, frameCount);
                var yTweenVals = getTweenValuesFromTo(tweenFuncs, frY, toY, frameCount);
                
                var column = zipPoints(xTweenVals, yTweenVals);
                columns.push(column);
            }

            // get rows
            var rowCount;
            if (columns[0]) {
                var allSame = true;
                rowCount = columns[0].length;
                // check to make sure all columns are of same length
                for (var i = 0; i < columns.length; i++) {
                    if (columns[i].length != rowCount) {
                        allSame = false;
                        break;
                    }
                }
                if (!allSame) {
                    if (TESTING) {
                        console.log("!!!! ERROR In getTweenValues: columns must be of same length !!!!");
                    }
                    return null;
                }
            }
            
            var valuesArray = []; 
            // make rows of pairs from column of pairs
            for (var row = 0; row < rowCount; row++) {
                var rowString = [];
                for (var col = 0; col < columns.length; col++) {
                    rowString.push(columns[col][row]);
                }
                if ($.trim(rowString.join(" ")) !== "") {
                    valuesArray.push(rowString.join(" "));
                }
            }
            return valuesArray;
        }
    }
}

// params: xPoints - an array of numbers
//         yPoints - an array of numbers
// return: an array of strings, where x,y are comma seperated and trimmed
function zipPoints(xPoints, yPoints) {
    if (xPoints.length != yPoints.length) {
        if (TESTING) {
            console.log("!!!! ERROR in zipPoints(): length of x and y points does not match !!!!");
        }
        return null;
    }
    
    var pairsArray = [];

    for (var i = 0; i < xPoints.length; i++) {
        pairsArray.push($.trim(xPoints[i]) + "," + $.trim(yPoints[i]));
    }
    return pairsArray; 
}

// params: tweenFuncs - an array of length 1 or 2 containing tween functions
//         from       - a starting number or array of numbers 
//         to         - an ending number or array of numbers
//         frameCount - the number of frames to be included per each animation
// return: an array of numbers or a recursive array of arrays containing numbers
//         which are the tween values
// TODO: write tests
function getValuesRecursive(tweenFuncs, from, to, frameCount) {
    if (typeof(from) === "number" && typeof(to) === "number") {
        return getTweenValuesFromTo(tweenFuncs, from, to, frameCount); 
    } else if (from instanceof Array && to instanceof Array) {
        var valuesArray = [];
        for (var i = 0; i < from.length; i++) {
            valuesArray.push(getValuesRecursive(tweenFuncs, from[i], to[i], frameCount));
        }
        return valuesArray;
    } else if (typeof(from) === "string" && typeof(to) === "string") {
        return getTweenValuesFromTo(tweenFuncs, parseInt(from), parseInt(to), frameCount);
    } else {
        if (TESTING) {
            console.log("In getValuesRecursive(): from and to must both be numbers or arrays");
            console.log("From: " + from);
            console.log("To:   " + to);
        }
        return null;
    }
}

// params: tweenFuncs - an array of tweening functions of length 1 or 2
//         fromVal    - the starting pixel value of the tween
//         toVal      - the ending pixel value of the tween
//         frameCount - the number of total frames needed in the animation
//                      inclusive of the from and to values
// return: an array of numbers that range from fromVal to toVal using the
//         tween functions defined in the tweenFuncs array to determine
//         any easing or linear function used to scale tween values
function getTweenValuesFromTo(tweenFuncs, fromVal, toVal, frameCount) {
    // make sure that frameCount is odd
    var frames = null;
    if (frameCount % 2 != 1) {
        if (TESTING) {
            console.log("In getTweenValuesFromTo(): frameCount must be odd");
            console.log("Frame count: " + frameCount);
        }
    } else if (frameCount < 3) {
        if (TESITNG) {
            console.log("In getTweenValuesFromTo(): must have 3 or more frames to get values");
            console.log("Frame count: " + frameCount);
        }
    } else { // enough frames to start
        // check if moving positive or negative
        frames = [];
        if (fromVal === toVal) {
            for (var n = 0; n < frameCount; n++) {
                frames.push(fromVal);
            }
        } else { // from val and to val are different, need to calculate tween values
            // frames to calculate = frame count - 3 (don't count fromVal, midVal,
            // and toVal). Divide by 2 for each half:
            // [fromVal -> midVal] and [midVal -> toVal]
            var numFramesToCalculatePerHalf = (frameCount - 3) / 2;

            // add fromVal
            frames = [fromVal];
            var tweens;
            // determine if tweens
            // NOTE: tweenFuncs should be of max length 2
            if (tweenFuncs instanceof Function || tweenFuncs.length === 1) {
                // make sure that you have a function
                var tweenFunc = tweenFuncs instanceof Array ? tweenFuncs[0] : tweenFuncs;
                if (tweenFunc instanceof Function) {
                    // NOTE: these tween values will be added below
                    tweens = tweenFunc(fromVal, toVal, numFramesToCalculatePerHalf * 2 + 1);
                } else {
                    if (TESTING) {
                        console.log("In getTweenValuesFromTo(): tweenFuncs parameter passed is not a Function");
                        console.log("typeof(tweenFunc): " + typeof(tweenFunc));
                    }
                    return null;
                }
            } else if (tweenFuncs.length === 2) {
                if (tweenFuncs[0] instanceof Function && tweenFuncs[1] instanceof Function) {
                    var midVal = Math.round((fromVal + toVal) / 2);

                    // add from fromVal to midVal
                    tweens = tweenFuncs[0](fromVal, midVal, numFramesToCalculatePerHalf);
                    for (var i = 0; i < tweens.length; i++) {
                        frames.push(tweens[i]);
                    }
                    // add midVal
                    frames.push(midVal);
                    // get from midVal to toVal
                    // NOTE: these tween values will be added below
                    tweens = tweenFuncs[1](midVal, toVal, numFramesToCalculatePerHalf);
                } else {

                }
            } else { // tweenFuncs is not of length 1 or 2
                if (TESTING) {
                    console.log("In getTweenValuesFromTo(): tweenFuncs parameter formatted improperly");
                    console.log("Expecting: <1st tween function> [optional , <2nd tween function>]");
                    console.log("Value passed: " + tweenFuncs);
                }
                return null;
            }
            
            // add middle frames set by above tween assignments
            for (var i = 0; i < tweens.length; i++) {
                frames.push(tweens[i]);
            }
 
            // add toVal
            frames.push(toVal);

            if (frames.length != frameCount) {
                if (TESTING) {
                    console.log("In getTweenValuesFromTo(): not enough values calculated by tween functions");
                    console.log("Expected frame count: " + frameCount);
                    console.log("Actual frame count:   " + frames.length);
                    console.log("Frames:               " + frames);
                }
                return null;
            }
        }
    }
    return frames;
}

/************************************
* Tween Definitions                 *
************************************/
// params: start          - the starting pixel location (int)
//         end            - the ending pixel location (int)
//         numTweenFrames - the number of frames between the start and end
// return: an array with the pixel values for the tween locations
// behavior: even distribute points between start and end
function linearTween(start, end, numTweenFrames) {
    var unit = (end - start) / (numTweenFrames + 1);
    var frames = [];
    for (var i = 1; i <= numTweenFrames; i++) {
        frames.push(start + (i * unit));
    }
    return frames;
}

// params: start          - the starting pixel location (int)
//         end            - the ending pixel location (int)
//         numTweenFrames - the number of frames between the start and end
// return: an array with the pixel values for the tween locations
// behavior: start out slow, then move faster to end point
function easeInTween(start, end, numTweenFrames) {
    var frames = [];
    var offset     = getEaseValues(start, end, numTweenFrames);
    for (var i = 0; i < numTweenFrames; i++) {
        frames.push(start + offset[i]);
    }
    return frames;
}

// params: start          - the starting pixel location (int)
//         end            - the ending pixel location (int)
//         numTweenFrames - the number of frames between the start and end
// return: an array with the pixel values for the tween locations
// behavior: start out fast, then slow down as you reach the end point
function easeOutTween(start, end, numTweenFrames) {
    var frames = [];
    var offset     = getEaseValues(end, start, numTweenFrames);
    for (var i = 0; i < numTweenFrames; i++) {
        frames.push(end + offset[i]);
    }
    frames.reverse();
    return frames;
}

// params: start          - the starting pixel location (int)
//         end            - the ending pixel location (int)
//         numTweenFrames - the number of frames between the start and end
// return: an array of offset values from the start position going to the
//         ending value using a simple exponential function specified by
//         the exp var defined within the body of this function
function getEaseValues(start, end, numTweenFrames) {
    // get exponent function
    var seg = 1 / numTweenFrames;
    var exp = 2; // will be used to define the power of the exponential function
    var vals = [];

    // find values for offsets from 0 - 1, without scaling
    for (var i = 0; i < numTweenFrames; i++) {
        vals.push(Math.pow(seg * i, exp));
    }
    // scale values to match segment
    var scale = end - start;
    for (var i = 0; i < vals.length; i++) {
        vals[i] = vals[i] * scale;
    }
    return vals;
}

/************************************
* Main                              *
************************************/
$(document).ready(function() {

	// get screen information
    screen_dimensions = getScreenDimensions(); // array [width, height]
    IS_TOUCH_DEVICE = isTouchDevice();

    if (isRetinaScreen()) {
        // load retina assets
    } else {
        // load regular assets
    }

    if (TESTING) {
        console.log("Initial Screen Dimensions are: " + screen_dimensions);
    }
	
	// keep screen_dimensions up to date
	window.onresize = function() {
        debounce(function() {
            screen_dimensions = getScreenDimensions();
        }, 500, "Screen dimensions");
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

    // zero out all horizontal bar charts
    $(".lotus-charts.horizontal-bar-chart").each(function() {
        zeroOutBars($(this));
    });
    
    // start up vertical bar charts
    startVerticalBarCharts();
});

$(window).load(function() {
    // start up horizontal bar charts
    startHorizontalBarCharts();
    // start up line charts
    startLineCharts();
});
