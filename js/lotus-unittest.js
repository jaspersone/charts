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
    
    if (expected == null || actual == null) {
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
    resultsArray[0] += test;
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
    var expected;
    var actual;

    // you should assign expected and actual values here

    return printTest(testName, expected, actual);
}
*/

/************************************
* Test Charts General               *
************************************/



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
    var expected;
    var actual;

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
    var expected;
    var actual;

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
    var expected;
    var actual;

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
    var expected;
    var actual;

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
    var expected;
    var actual;

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
    var expected;
    var actual;

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
    var expected;
    var actual;

    var maxValue = 100;
    var pixelHeight = 300;

    // you should assign expected and actual values here
    expected = 1;
    actual = getBestIncrement(maxValue, pixelHeight);

    return printTest(testName, expected, actual);
}

function test_getBestIncrement2() {
    var testName = "getBestIncrement() - basic 1 to 1";
    var expected;
    var actual;

    var maxValue = 300;
    var pixelHeight = 300;

    // you should assign expected and actual values here
    expected = 1;
    actual = getBestIncrement(maxValue, pixelHeight);

    return printTest(testName, expected, actual);
}

function test_getBestIncrement3() {
    var testName = "getBestIncrement() - basic 1 to 10";
    var expected;
    var actual;

    var maxValue = 3000;
    var pixelHeight = 300;

    // you should assign expected and actual values here
    expected = 10;
    actual = getBestIncrement(maxValue, pixelHeight);

    return printTest(testName, expected, actual);
}

function test_getBestIncrement4() {
    var testName = "getBestIncrement() - large numbers";
    var expected;
    var actual;

    var maxValue = 5450000;
    var pixelHeight = 300;

    // you should assign expected and actual values here
    expected = 10000;
    actual = getBestIncrement(maxValue, pixelHeight);

    return printTest(testName, expected, actual);
}

function test_getBestIncrement5() {
    var testName = "getBestIncrement() - very large and complicated numbers";
    var expected;
    var actual;

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
function run_calculateYPixel() {
    var testGroupName = "Calculate Y Pixel Tests ";
    var resultsArray = [0, 0];

    // tests
    sumResult(resultsArray, test_calculateYPixel1());
    sumResult(resultsArray, test_calculateYPixel2());
    //sumResult(resultsArray, test_calculateYPixel3());
    //sumResult(resultsArray, test_calculateYPixel4());
    //sumResult(resultsArray, test_calculateYPixel5());

    printGroupResults(testGroupName, resultsArray);
}

function test_calculateYPixel1() {
    var testName = "calculateYPixel() - simple case";
    var expected;
    var actual;

    var value = 0;
    var chartMinValue = 0;
    var chartMaxValue = 100;
    chartHeight = 100;

    // you should assign expected and actual values here
    expected = 100;
    actual = calculateYPixel(value, chartMinValue, chartMaxValue, chartHeight);

    return printTest(testName, expected, actual);
}

function test_calculateYPixel2() {
    var testName = "calculateYPixel() - simple case 2";
    var expected;
    var actual;

    var value = 100;
    var chartMinValue = 0;
    var chartMaxValue = 100;
    chartHeight = 100;

    // you should assign expected and actual values here
    expected = 0;
    actual = calculateYPixel(value, chartMinValue, chartMaxValue, chartHeight);

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
    var expected;
    var actual;
    
    expected = ["foo", 1980, 0, 500, 50, [-375,361]];
    var line1 = new Line(null, "foo1", "bar", [1,2,3,4,5,6,7,8,9,10,11,23,45]);
    var line2 = new Line(null, "foo2", "bar", [1,2,3,-20,-30,-314,20,40,108]);
    var lines = [line1, line2];
    var testLineChart = new LineChart("foo", "1980/11/24", "2012/1/1", 500, 50, lines);
    actual = [testLineChart.id, testLineChart.startDate.getFullYear(), 
              testLineChart.endDate.getMonth(), testLineChart.pixelHeight,
              testLineChart.segmentPixelWidth, getMinMaxFromLines(testLineChart.lines)
             ];
    return printTest(testName, expected, actual);
}

function test_createLineChart_single_line() {
    var testName = "createLineChart_single_line() - create a new LineChart and testing parameters";
    var expected;
    var actual;
    
    expected = ["foo", 1980, 0, 500, 50, [1,2,3,4,5,6,7,8,9,10,11,23,45]];
    var line1 = new Line(null, "foo1", "bar", [1,2,3,4,5,6,7,8,9,10,11,23,45]);
    var testLineChart = new LineChart("foo", "1980/11/24", "2012/1/1", 500, 50, line1);
    actual = [testLineChart.id, testLineChart.startDate.getFullYear(), 
              testLineChart.endDate.getMonth(), testLineChart.pixelHeight,
              testLineChart.segmentPixelWidth, testLineChart.lines[0].data
             ];
    return printTest(testName, expected, actual);
}

function test_createLineChart_no_lines() {
    var testName = "createLineChart_no_lines() - create a new LineChart and testing parameters";
    var expected;
    var actual;
    
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
    var expected;
    var actual;
    
    expected = [[1,2,3,4,5,6,7,8,9,10,11,23,45], [1,2,3,-20,-30,-314,20,40,108]];
    var line1 = new Line(null, "foo1", "bar", [1,2,3,4,5,6,7,8,9,10,11,23,45]);
    var line2 = new Line(null, "foo2", "bar", [1,2,3,-20,-30,-314,20,40,108]);
    var lines = [line1, line2];
    var testLineChart = new LineChart("foo", "1980/11/24", "2012/1/1", 500, 50, lines);
    actual = [testLineChart.lines[0].data, testLineChart.lines[1].data];
    return printTest(testName, expected, actual);
}

function test_LineChart_set_line_parent() {
    var testName = "test_LineChart_set_line_parent() - do the lines get updated to have correct parent";
    var expected;
    var actual;
    
    var line1 = new Line(null, "foo1", "bar", [1,2,3,4,5,6,7,8,9,10,11,23,45]);
    var line2 = new Line(null, "foo2", "bar", [1,2,3,-20,-30,-314,20,40,108]);
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
    sumResult(resultsArray, test_getMinMaxFromLines());
    sumResult(resultsArray, test_Line_getLineString());
    printGroupResults(testGroupName, resultsArray);
}

function test_createLine_no_data() {
    var testName = "createLine_no_data() - create a new line without data";
    var expected;
    var actual;
    
    expected = [null, "foo", "bar", null];
    var testLine = new Line(null, "foo", "bar");
    actual = [testLine.parentChart, testLine.idName, testLine.className, testLine.data];

    return printTest(testName, expected, actual);
}

function test_createLine_with_data() {
    var testName = "createLine_with_data() - create a new line with data";
    var expected;
    var actual;

    expected = [null, "foo", "bar", [1,2,3]];
    var testLine = new Line(null, "foo", "bar", [1,2,3]);
    actual = [testLine.parentChart, testLine.idName, testLine.className, testLine.data];

    return printTest(testName, expected, actual);
}

function test_getMinMaxFromLines() {
    var testName = "getMinMaxFromLines() - create a few lines and find min and max";
    var expected;
    var actual;

    var line1 = new Line(null, "foo1", "bar", [1,2,3,4,5,6,7,8,9,10,11,23,45]);
    var line2 = new Line(null, "foo2", "bar", [1,2,3,-20,-30,-314,20,40,108]);
    var line3 = new Line(null, "foo3", "bar", [45]);
    var line4 = new Line(null, "foo4", "bar", [101,102,103,104,15]);
    var line5 = new Line(null, "foo5", "bar", [301,1,2,3]);
    var lines = [line1, line2, line3, line4, line5];

    expected = [-376, 363];
    actual   = getMinMaxFromLines(lines);
    return printTest(testName, expected, actual);
}

function test_Line_getLineString() {
    var testName = "test_Line_getLineString() - get proper svg string from line"
    var expected;
    var actual;

    expected = '<polyline class="foo" points="0,530 50,50" />'
    var testLine = new Line(null, null, "foo", [20, 500]);
    var testLineChart = new LineChart("lineChart1", "1980/11/24", "2012/1/1", 600, 50, testLine);
    actual = testLine.getLineString();
 
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
    
    run_getNearestValueTests();
    run_getNearestPixel();
    run_getChartScaleMax();
    run_getBestIncrement();
    run_calculateYPixel();
    run_LineChartTests();
    run_LineTests();
}
