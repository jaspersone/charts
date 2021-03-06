/************************************
* Lotus Charts UNIT TESTS JS v0.01  *
* August 01, 2012                   *
************************************/

/************************************
* Global Variables  	   	 	    *
************************************/

/************************************
* Basic Testing Functions  	  	    *
************************************/
// TODO: write documentation
function printTest(testName, expected, actual) {
    console.log("--------------------------------------------------------");
    console.log("Testing: " + testName);
    console.log("--------------------------------------------------------");
    
    if (expected === undefined || actual === undefined) {
        console.log(">>>> test failed <<<< Test has not been completely written.");
        return 0;
    }
    console.log("Expected: " + expected);
    console.log("Actual  : " + actual);
    if (compare(expected, actual)) {
        console.log("test passed\n");
        return 1;
    }
    else {
        console.log(">>>> test failed <<<<\n");
        return 0;
    }
}

function printGroupResults(testName, resultsArray) {
    console.log("========================================================");
    console.log(testName + ": complete.");
    console.log(resultsArray[0] + " passed out of " + resultsArray[1] + " tests.");
    console.log("========================================================\n\n");
}

// TODO: need to refactor to better test for objects
function compare(expected, actual) {
    // check for arrays
    if (expected instanceof Array) {
        if (actual instanceof Array && actual.length == expected.length) {
            for (var i = 0; i < expected.length; i++) {
                if (!compare(actual[i], expected[i])) { return false; }
            }
            return true; // everything in this actual array is the same as expected
        }
        return false; // both are arrays but lengths are different, don't compare
    }
    // TODO: may need to make this more strict "==="
    return expected === actual; // simple comparison of if not array
}

function sumArray(the_array) {
    var total = 0;
    for (x in the_array) { total += x; }
    return total;
}

// mutates an array which keeps track of two values
// resultsArray[0] = number of tests passed
// resultsArray[1] = total number of tests
function sumResult(resultsArray, test) {
    if (test == 0 || test == 1) {
        resultsArray[0] += test;
    }
    resultsArray[1] += 1;
}

// Basic test group function body:

/*
function run_() {
    var testGroupName = "";
    var resultsArray = [0, 0];

    // tests
    sumResult(resultsArray, test_());

    printGroupResults(testGroupName, resultsArray);
}
*/

// Basic test function body:
/*
function test_() {
    var testName = "";
    var expected, actual;

    // you should assign expected and actual values here

    return printTest(testName, expected, actual);
}
*/

/************************************
* Test Charts General               *
************************************/
function run_general_tests() {
    var testGroupName = "General Function Tests ";
    var resultsArray = [0, 0];

    // tests
    sumResult(resultsArray, test_convertToInts_string_to_int());
    sumResult(resultsArray, test_convertToInts_basic_all_ints());
    sumResult(resultsArray, test_convertToInts_advanced());

    printGroupResults(testGroupName, resultsArray);
}

function test_convertToInts_string_to_int() {
    var testName = "Convert string to int using convertToInts()";
    var expected, actual;

    expected = 3;
    actual = convertToInts("3");

    return printTest(testName, expected, actual);
}

function test_convertToInts_basic_all_ints() {
    var testName = "Convert array of strings to array of ints";
    var expected, actual;

    expected = [1,2,3,4,5];
    actual = convertToInts(["1", "2", "3", "4", "5"]);

    return printTest(testName, expected, actual);
}

function test_convertToInts_advanced() {
    var testName = "Convert complicated array of arrays of strings";
    var expected, actual;

    expected = [[1,2,3,4,5],[null, null, -7],[10,11,12]];
    actual = convertToInts([["1", "2", "3", "4", "5"], ["a", "b", "-7"], [10, 11, "12"]]);

    return printTest(testName, expected, actual);
}

/************************************
* Test Get Nearest Value            *
************************************/

function run_getNearestValueTests() {
    var testGroupName = "Get Nearest Value Tests";
    var resultsArray = [0, 0];

    sumResult(resultsArray, test_getNearestValue1());
    sumResult(resultsArray, test_getNearestValue2());
    sumResult(resultsArray, test_getNearestValue3());

    printGroupResults(testGroupName, resultsArray);
}

function test_getNearestValue1() {
    var testName = "getNearestValue() - Basic rounding down";
    var expected, actual;

    var maxPixel = 300;
    var maxChartValue = 300;
    var pixel = 247;
    var increment = 5;
    
    expected = 245;
    actual = getNearestValue(maxPixel, maxChartValue, pixel, increment);
    return printTest(testName, expected, actual);
}

function test_getNearestValue2() {
    var testName = "getNearestValue() - Basic no rounding needed";
    var expected, actual;

    // you should assign expected and actual values here
    var maxPixel = 300;
    var maxChartValue = 300;
    var pixel = 247;
    var increment = 1;
    
    expected = 247;
    actual = getNearestValue(maxPixel, maxChartValue, pixel, increment);

    return printTest(testName, expected, actual);
}

function test_getNearestValue3() {
    var testName = "getNearestValue() - Basic rounding needed";
    var expected, actual;

    // you should assign expected and actual values here
    var maxPixel = 300;
    var maxChartValue = 300;
    var pixel = 247;
    var increment = 5;
    
    expected = 245;
    actual = getNearestValue(maxPixel, maxChartValue, pixel, increment);

    return printTest(testName, expected, actual);
}

/************************************
* Test Get Nearest Pixel            *
************************************/
function run_getNearestPixel() {
    var testGroupName = "Get Nearest Pixel Tests";
    var resultsArray = [0, 0];

    sumResult(resultsArray, test_getNearestPixel1());
    sumResult(resultsArray, test_getNearestPixel2());
    sumResult(resultsArray, test_getNearestPixel3());

    printGroupResults(testGroupName, resultsArray);
}

function test_getNearestPixel1() {
    var testName = "getNearestPixel() - Basic no rounding needed, one to one scale";
    var expected, actual;

    // you should assign expected and actual values here
    var maxPixel = 300;
    var maxChartValue = 300;
    var chartValue = 247;
    
    expected = 247;
    actual = getNearestPixel(maxPixel, maxChartValue, chartValue);

    return printTest(testName, expected, actual);
}

function test_getNearestPixel2() {
    var testName = "getNearestPixel() - Basic no rounding needed, double scale";
    var expected, actual;

    // you should assign expected and actual values here
    var maxPixel = 300;
    var maxChartValue = 600;
    var chartValue = 300;
    
    expected = 150;
    actual = getNearestPixel(maxPixel, maxChartValue, chartValue);

    return printTest(testName, expected, actual);
}

function test_getNearestPixel3() {
    var testName = "getNearestPixel() - Basic rounding needed";
    var expected, actual;

    // you should assign expected and actual values here
    var maxPixel = 300;
    var maxChartValue = 1000;
    var chartValue = 334;
    
    expected = 100;
    actual = getNearestPixel(maxPixel, maxChartValue, chartValue);

    return printTest(testName, expected, actual);
}

/************************************
* Test Get Chart Scale Max          *
************************************/
function run_getChartScaleMax() {
    var testGroupName = "Get Chart Scale Max Tests";
    var resultsArray = [0, 0];
    
    var idString = "#purdy-fake-chart";
    var fakeChart = "<div id='purdy-fake-chart' rel='600'></div>";

    // tests
    sumResult(resultsArray, test_getChartScaleMax1(fakeChart, idString));
    sumResult(resultsArray, test_getChartScaleMax2(fakeChart, idString));
    sumResult(resultsArray, test_getChartScaleMax3(fakeChart, idString));

    printGroupResults(testGroupName, resultsArray);
}

// Basic test function body:
function test_getChartScaleMax1(fakeChartString, idString) {
    // create fake chart div
    $("body").append(fakeChartString);
    
    var testName = "getNearestChartScaleMax() - valid value exists";
    var expected = 600;
    var actual = getChartScaleMax($(idString));

    // destroy fake chart div
    $(idString).remove();

    return printTest(testName, expected, actual);
}

function test_getChartScaleMax2(fakeChartString, idString) {
    // create fake chart div
    $("body").append(fakeChartString);
    $(idString).removeAttr("rel");
    // copy over temp_DEFAULT_MAX_SCALE
    var temp_DEFAULT_MAX_SCALE = DEFAULT_MAX_SCALE;
    DEFAULT_MAX_SCALE = 300;

    var testName = "getNearestChartScaleMax() - no rel value exists";
    var expected = 300;
    var actual = getChartScaleMax($(idString));

    // restore DEFAULT_MAX_SCALE
    DEFAULT_MAX_SCALE = temp_DEFAULT_MAX_SCALE;

    // destroy fake chart div
    $(idString).remove();

    return printTest(testName, expected, actual);
}

function test_getChartScaleMax3(fakeChartString, idString) {
    // create fake chart div
    $("body").append(fakeChartString);
    $(idString).attr("rel", "foo");
    // copy over temp_DEFAULT_MAX_SCALE
    var temp_DEFAULT_MAX_SCALE = DEFAULT_MAX_SCALE;
    DEFAULT_MAX_SCALE = 300;

    var testName = "getNearestChartScaleMax() - no rel value is not a number";
    var expected = 300;
    var actual = getChartScaleMax($(idString));

    // restore DEFAULT_MAX_SCALE
    DEFAULT_MAX_SCALE = temp_DEFAULT_MAX_SCALE;

    // destroy fake chart div
    $(idString).remove();

    return printTest(testName, expected, actual);
}

/************************************
* Test Get Chart Scale Max          *
************************************/
function run_getBestIncrement() {
    var testGroupName = "Get Best Increment Tests ";
    var resultsArray = [0, 0];

    // tests
    sumResult(resultsArray, test_getBestIncrement1());
    sumResult(resultsArray, test_getBestIncrement2());
    sumResult(resultsArray, test_getBestIncrement3());
    sumResult(resultsArray, test_getBestIncrement4());
    sumResult(resultsArray, test_getBestIncrement5());

    printGroupResults(testGroupName, resultsArray);
}

function test_getBestIncrement1() {
    var testName = "getBestIncrement() - less than 1 to 1";
    var expected, actual;

    var maxValue = 100;
    var pixelHeight = 300;

    // you should assign expected and actual values here
    expected = 1;
    actual = getBestIncrement(maxValue, pixelHeight);

    return printTest(testName, expected, actual);
}

function test_getBestIncrement2() {
    var testName = "getBestIncrement() - basic 1 to 1";
    var expected, actual;

    var maxValue = 300;
    var pixelHeight = 300;

    // you should assign expected and actual values here
    expected = 1;
    actual = getBestIncrement(maxValue, pixelHeight);

    return printTest(testName, expected, actual);
}

function test_getBestIncrement3() {
    var testName = "getBestIncrement() - basic 1 to 10";
    var expected, actual;

    var maxValue = 3000;
    var pixelHeight = 300;

    // you should assign expected and actual values here
    expected = 10;
    actual = getBestIncrement(maxValue, pixelHeight);

    return printTest(testName, expected, actual);
}

function test_getBestIncrement4() {
    var testName = "getBestIncrement() - large numbers";
    var expected, actual;

    var maxValue = 5450000;
    var pixelHeight = 300;

    // you should assign expected and actual values here
    expected = 10000;
    actual = getBestIncrement(maxValue, pixelHeight);

    return printTest(testName, expected, actual);
}

function test_getBestIncrement5() {
    var testName = "getBestIncrement() - very large and complicated numbers";
    var expected, actual;

    var maxValue = 123748975632347;
    var pixelHeight = 300;

    // you should assign expected and actual values here
    expected = 100000000000;
    actual = getBestIncrement(maxValue, pixelHeight);

    return printTest(testName, expected, actual);
}

/************************************
* Test Calculate Y Pixel            *
************************************/
function run_calculatePixel() {
    var testGroupName = "Calculate Y Pixel Tests ";
    var resultsArray = [0, 0];

    // tests
    sumResult(resultsArray, test_calculatePixel1());
    sumResult(resultsArray, test_calculatePixel2());
    sumResult(resultsArray, test_calculatePixel3());
    //sumResult(resultsArray, test_calculatePixel4());
    //sumResult(resultsArray, test_calculatePixel5());

    printGroupResults(testGroupName, resultsArray);
}

function test_calculatePixel1() {
    var testName = "calculatePixel() - simple case";
    var expected, actual;

    var value = 0;
    var chartMinValue = 0;
    var chartMaxValue = 100;
    chartHeight = 100;

    // you should assign expected and actual values here
    expected = 100;
    actual = calculatePixel(value, chartMinValue, chartMaxValue, chartHeight);

    return printTest(testName, expected, actual);
}

function test_calculatePixel2() {
    var testName = "calculatePixel() - simple case 2";
    var expected, actual;

    var value = 100;
    var chartMinValue = 0;
    var chartMaxValue = 100;
    chartHeight = 100;

    // you should assign expected and actual values here
    expected = 0;
    actual = calculatePixel(value, chartMinValue, chartMaxValue, chartHeight);

    return printTest(testName, expected, actual);
}

function test_calculatePixel3() {
    var testName = "calculatePixel() - simple case 3";
    var expected, actual;

    var value = 100;
    var chartMinValue = -100;
    var chartMaxValue = 300;
    chartHeight = 100;

    // you should assign expected and actual values here
    expected = 50;
    actual = calculatePixel(value, chartMinValue, chartMaxValue, chartHeight);

    return printTest(testName, expected, actual);
}

/************************************
* Test LineChart                    *
************************************/
function run_LineChartTests() {
    var testGroupName = "LineChart Tests ";
    var resultsArray = [0, 0];

    sumResult(resultsArray, test_createLineChart());
    sumResult(resultsArray, test_createLineChart_single_line());
    sumResult(resultsArray, test_createLineChart_no_lines());
    sumResult(resultsArray, test_LineChart_retrieve_chart_data());
    sumResult(resultsArray, test_LineChart_set_line_parent());

    printGroupResults(testGroupName, resultsArray);
}

function test_createLineChart() {
    var testName = "createLineChart() - create a new LineChart and testing parameters";
    var expected, actual;
    
    expected = ["foo", 1980, 0, 500, 50, [-356,150]];
    var line1 = new Line(null, "foo1", "bar", "1 2 3 4 5 6 7 8 9 10 11 23 45");
    var line2 = new Line(null, "foo2", "bar", "1 2 3 -20 -30 -314 20 40 108");
    var lines = [line1, line2];
    var testLineChart = new LineChart("foo", "1980/11/24", "2012/1/1", 500, 50, lines);
    actual = [testLineChart.id, testLineChart.startDate.getFullYear(), 
              testLineChart.endDate.getMonth(), testLineChart.pixelHeight,
              testLineChart.segmentPixelWidth, [testLineChart.minValue, testLineChart.maxValue]
             ];
    return printTest(testName, expected, actual);
}

function test_createLineChart_single_line() {
    var testName = "createLineChart_single_line() - create a new LineChart and testing parameters";
    var expected, actual;
    
    expected = ["foo", 1980, 0, 500, 50, [1,2,3,4,5,6,7,8,9,10,11,23,45]];
    var line1 = new Line(null, "foo1", "bar", "1 2 3 4 5 6 7 8 9 10 11 23 45");
    var testLineChart = new LineChart("foo", "1980/11/24", "2012/1/1", 500, 50, line1);
    actual = [testLineChart.id, testLineChart.startDate.getFullYear(), 
              testLineChart.endDate.getMonth(), testLineChart.pixelHeight,
              testLineChart.segmentPixelWidth, testLineChart.lines[0].data
             ];
    return printTest(testName, expected, actual);
}

function test_createLineChart_no_lines() {
    var testName = "createLineChart_no_lines() - create a new LineChart and testing parameters";
    var expected, actual;
    
    expected = ["foo", 1980, 0, 500, 50, 0];
    var testLineChart = new LineChart("foo", "1980/11/24", "2012/1/1", 500, 50);
    actual = [testLineChart.id, testLineChart.startDate.getFullYear(), 
              testLineChart.endDate.getMonth(), testLineChart.pixelHeight,
              testLineChart.segmentPixelWidth, testLineChart.lines.length
             ];
    return printTest(testName, expected, actual);
}

function test_LineChart_retrieve_chart_data() {
    var testName = "test_LineChart_retrieve_chart_data() - do the lines store correct data";
    var expected, actual;
    
    var e1    = [1,2,3,4,5,6,7,8,9,10,11,23,45];
    var e2    = [1,2,3,-20,-30,-314,20,40,108];
    expected  = [e1, e2];
    var line1 = new Line(null, "foo1", "bar", "1 2 3 4 5 6 7 8 9 10 11 23 45");
    var line2 = new Line(null, "foo2", "bar", "1 2 3 -20 -30 -314 20 40 108");
    var lines = [line1, line2];
    var testLineChart = new LineChart("foo", "1980/11/24", "2012/1/1", 500, 50, lines);
    actual = [testLineChart.lines[0].data, testLineChart.lines[1].data];
    return printTest(testName, expected, actual);
}

function test_LineChart_set_line_parent() {
    var testName = "test_LineChart_set_line_parent() - do the lines get updated to have correct parent";
    var expected, actual;
    
    var line1 = new Line(null, "foo1", "bar", "1 2 3 4 5 6 7 8 9 10 11 23 45");
    var line2 = new Line(null, "foo2", "bar", "1 2 3 -20 -30 -314 20 40 108");
    var lines = [line1, line2];
    var testLineChart = new LineChart("lineChart1", "1980/11/24", "2012/1/1", 500, 50, lines);
    expected = [testLineChart, testLineChart.id];
    actual = [testLineChart.lines[0].parentChart, testLineChart.lines[1].parentChart.id];
    return printTest(testName, expected, actual);
}

/************************************
* Test Lines                        *
************************************/
function run_LineTests() {
    var testGroupName = "Line Tests ";
    var resultsArray = [0, 0];

    // tests
    sumResult(resultsArray, test_createLine_no_data());
    sumResult(resultsArray, test_createLine_with_data());
    sumResult(resultsArray, test_Line_getLineString());
    sumResult(resultsArray, test_Line_getLineString_with_offset());
    sumResult(resultsArray, test_parseData());
    sumResult(resultsArray, test_parseData_with_no_data());
    printGroupResults(testGroupName, resultsArray);
}

function test_createLine_no_data() {
    var testName = "createLine_no_data() - create a new line without data";
    var expected, actual;
    
    expected = [null, "foo", "bar", null];
    var testLine = new Line(null, "foo", "bar");
    actual = [testLine.parentChart, testLine.idName, testLine.className, testLine.data];

    return printTest(testName, expected, actual);
}

function test_createLine_with_data() {
    var testName = "createLine_with_data() - create a new line with data";
    var expected, actual;

    expected = [null, "foo", "bar", [1,2,3]];
    var testLine = new Line(null, "foo", "bar", "1 2 3");
    actual = [testLine.parentChart, testLine.idName, testLine.className, testLine.data];

    return printTest(testName, expected, actual);
}

function test_Line_getLineString() {
    var testName = "test_Line_getLineString() - get proper svg string from line"
    var expected, actual;

    expected = '<polyline class="foo" points="0,530 50,50" />\n<circle class="foo" cx="0" cy="530" r="6" />\n<circle class="foo" cx="50" cy="50" r="6" />'
    var temp = "20 50";
    var testLine = new Line(null, null, "foo", temp);
    var testLineChart = new LineChart("lineChart1", "1980/11/24", "2012/1/1", 600, 50, testLine);
    actual = testLine.getLineString();
 
    return printTest(testName, expected, actual);
}

function test_Line_getLineString_with_offset() {
    var testName = "test_Line_getLineString_with_offset() - get proper svg string from line that has offset"
    var expected, actual;

    expected = '<polyline class="foo" points="100,530 150,50" />\n<circle class="foo" cx="100" cy="530" r="6" />\n<circle class="foo" cx="150" cy="50" r="6" />'
    var testLine = new Line(null, null, "foo", "(2) 20 500");
    var testLineChart = new LineChart("lineChart1", "1980/11/24", "2012/1/1", 600, 50, testLine);
    actual = testLine.getLineString();
 
    return printTest(testName, expected, actual);
}

function test_parseData() {
    var testName = "test_parseData() - test that data is properly parsed into a dictionary"
    var expected, actual;

    var data ="[\
                {'ID'               :'line-graph-02'},\
                {'START'            :'1980/11/24'},\
                {'END'              :'2012/12/14'},\
                {'WIDTH'            :'100%'},\
                {'HEIGHT'           :'400'},\
                {'INCREMENT'        :'50'},\
                {'RADIUS'           :'6'},\
                {'cost'             :'20 50'},\
                {'projected-cost'   :'(2) 50 30'},\
                {'revenue'          :'120 150'},\
                {'projected-revenue':'(2) 150 130'},\
               ]"
    expected = ['line-graph-02', "1980/11/24", "2012/12/14", 
                '100%', '400', '50', '6', '20 50', '(2) 50 30', '120 150', '(2) 150 130'];
    var dict = parseData(data);
    actual   = [dict['ID'], dict['START'], dict['END'], dict['WIDTH'],
                dict['HEIGHT'], dict['INCREMENT'], dict['RADIUS'], dict['cost'],
                dict['projected-cost'], dict['revenue'], dict['projected-revenue']];
    return printTest(testName, expected, actual);
}

function test_parseData_with_no_data() {
    var testName = "test_parseData_with_no_data() - see if parse data properly returns empty dictionary if data is empty"
    var expected, actual;

    var empty = {}
    var temp = parseData();
    expected = [typeof(empty), Object.keys(empty).length];
    actual   = [typeof(temp), Object.keys(temp).length];

    return printTest(testName, expected, actual);
}

/************************************
* SVG Tween Tests                   *
************************************/
function run_svgTweenTests() {
    var testGroupName = "SVG Tween Tests ";
    var resultsArray = [0, 0];

    // tests
    sumResult(resultsArray, test_getTweenValues_null_values());
    sumResult(resultsArray, test_getTweenValues_mismatched_values());
    sumResult(resultsArray, test_getTweenValues_different_lengths());
    sumResult(resultsArray, test_linearTween_basic());
    sumResult(resultsArray, test_linearTween_negative_tween());
    sumResult(resultsArray, test_linearTween_negative_values());
    sumResult(resultsArray, test_getValuesRecursive_basic());
    printGroupResults(testGroupName, resultsArray);
}

function test_getTweenValues_null_values() {
    var testName = "test_getTweenValues_null_values()";
    var expected, actual;
    
    expected = null;
    actual = getTweenValues(null, null, 300);
    
    return printTest(testName, expected, actual);
}

function test_getTweenValues_mismatched_values() {
    var testName = "test_getTweenValues_mismatched_values()";
    var expected, actual;
    
    expected = null;
    actual = getTweenValues("1 2 3", [1, 2, 3], 300);
    
    return printTest(testName, expected, actual);
}

function test_getTweenValues_different_lengths() {
    var testName = "test_getTweenValues_different_lengths()"; 
    var expected, actual;
    
    expected = null;
    actual = getTweenValues("1 2 3", "1 2 3 4", 300);
    
    return printTest(testName, expected, actual);
}

function test_linearTween_basic() {
    var testName = "test_linearTween_basic()"; 
    var expected, actual;
    
    expected = [2,3,4];
    actual = linearTween(1,5,3);
    
    return printTest(testName, expected, actual);
}

function test_linearTween_negative_tween() {
    var testName = "test_linearTween_negative_tween()"; 
    var expected, actual;
    
    expected = [4,3,2];
    actual = linearTween(5,1,3);
    
    return printTest(testName, expected, actual);
}

function test_linearTween_negative_values() {
    var testName = "test_linearTween_negative_values()"; 
    var expected, actual;
    
    expected = [5,0,-5];
    actual = linearTween(10,-10,3);
    
    return printTest(testName, expected, actual);
}

function test_getValuesRecursive_basic() {
    var testName = "test_getValuesRecursive_basic()"; 
    var expected, actual;
    
    var tweenFuncs = [linearTween];
    var from       = [-10,-20,-30,-40,-50];
    var to         = [10,20,30,40,50];
    var frameCount = 5;

    expected = [[-10,  -5, 0,  5, 10],
                [-20, -10, 0, 10, 20],
                [-30, -15, 0, 15, 30],
                [-40, -20, 0, 20, 40],
                [-50, -25, 0, 25, 50]];
    actual = getValuesRecursive(tweenFuncs, from, to, frameCount);
    
    return printTest(testName, expected, actual);

}
/************************************
* Main                              *
************************************/
// Main function calls
$(document).ready(function() {
    if (TESTING) {
        startTests();
    }
});

function startTests() {
    var totalTests = 0;
    var totalPassed = 0;
    
    run_general_tests()
    run_getNearestValueTests();
    run_getNearestPixel();
    run_getChartScaleMax();
    run_getBestIncrement();
    run_calculatePixel();
    run_LineChartTests();
    run_LineTests();
    run_svgTweenTests();
}
