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
    console.log("Expected: " + expected);
    console.log("Actual  : " + actual);
    if (doTest(expected, actual)) { console.log("test passed"); }
    else { console.log(">>>> test failed <<<<"); }
    console.log("");
}

// TODO: need to refactor to better test for arrays and objects
function doTest(expected, actual) {
    return expected === actual;
}

// Basic test function body:
/*
function test_() {
    var testName = "";
    var expected;
    var actual;

    // you should assign expected and actual values here

    printTest(testName, expected, actual);
}
*/

/************************************
* Test Charts General               *
************************************/
function run_getNearestValueTests() {
    test_getNearestValue1();
    test_getNearestValue2();
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
    printTest(testName, expected, actual);
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

    printTest(testName, expected, actual);
}


/************************************
* Main                              *
************************************/
// Main function calls
$(document).ready(function() {
    if (TESTING) {
        console.log("");
        console.log("************************************");
        console.log("Lotus Charts UNIT TESTING SUITE V0.1");
        console.log("************************************");
        console.log("");

        run_getNearestValueTests();
    }
});
