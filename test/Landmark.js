// Load the helper functions
const helper = require('./helper_funcs.js');
for (var key in helper) global[key] = helper[key];

var default_limitLength = 720;

contract('Landmark', function(accounts) {
    
    var msg0 = "hello world!";
    var msg1 = "is there a point?";
    var msg2 = "this is the end.";
    var msg3 = "LOL! 💩 Emoji in Landmark 😀😀😀";
    var profileMsg0 = "I am who I say I am.";

    // *********************************************************************
    // Setters
    // *********************************************************************
    
    it("Simple, single post", function() {
	promise_execute("postMessage", msg0);
    });

    it("Set profile", function() {
	promise_execute("postProfile", profileMsg0);
    });
    
    it("Check post count after posting a few more", async function() {
	promise_execute("postMessage", msg1);
	promise_execute("postMessage", msg2);
	const result = (await promise_call("getMessageCount")).toNumber();
	assert.equal(result, 3);
    });

    it("Post profile", function() {
	promise_execute("postProfile", profileMsg0);
    });

    it("Unicode characters in post", async function() {
	await sleep(100);  // delay in posting to find timing differences
	await promise_execute("postMessage", msg3);
	const idx  = (await promise_call("getMessageCount")) - 1;
	const msgX = (await promise_call("getMessageContents",idx));
	console.log("Emoji test:", msgX);
    });


    // *********************************************************************
    // Getters
    // *********************************************************************

    it("Get curator address", async function() {
	const result = (await promise_call("getCuratorAddress"));
	console.log("Curator address", result);
    });

    it("Get max post length", async function() {
	const maxlength = (await promise_call("getLimitPostLength"));
	assert.equal(maxlength.toNumber(), default_limitLength);
    });
    
    it("Get post length", async function() {
	const length_eth = (await promise_call("getPostLength",  msg3));
	const length_js  = fancyCount(msg3);
	assert.equal(length_eth, length_js);
    });

    it("Get profile contents", async function() {
	const result = (await promise_call("getProfileContent", accounts[0]));
	assert.equal(result, profileMsg0);
    });

    it("Get message contents", async function() {
	const result = (await promise_call("getMessageContents", 1));
	assert.equal(result, msg1);
    });

    it("Get post message cost", async function() {
	const val = await promise_call("getCostPostMessage")
	assert.equal(val.toNumber(), 0);
    });

    it("Get post profile cost", async function() {
	const val = await promise_call("getCostPostProfile")
	assert.equal(val.toNumber(), 0);
    });

    it("Get message sender address", async function() {
	const result = (await promise_call("getMessageAddress", 1));
	assert.equal(result, accounts[0]);
	console.log("Message sender address", result);
    });

    it("Get message timestamp", async function() {
	const t0 = (await promise_call("getMessageTimestamp", 0));
	const t2 = (await promise_call("getMessageTimestamp", 3));
	assert(t0.toNumber() <= t2.toNumber(), "timestamps out of order");
    });

    it("Get contract value", async function() {
	const val = (await promise_call("getContractValue")).toNumber();
	console.log("Current contract value", val);
    });

    // *********************************************************************
    // Bounds checking
    // *********************************************************************

    it("Ask for a message that doesn't exist (larger than idx)",
       async function() {
	const k = (await promise_call("getMessageCount")).toNumber();
	failCall("getMessageContents", k+1);
    });

    it("Ask for a message that doesn't exist (negative)", function() {
	failCall("getMessageContents", -1);
    });

    it("Ask for a profile that doesn't exist", function() {
	failCall("getProfileContent", accounts[1]);
    });

    it("Post a message too long", async function() {
	const k = (await promise_call("getLimitPostLength")).toNumber();
	const msg = 'x'.repeat(k+1)
	failExecute("postMessage", msg);
    });

    it("Post a profile too long", async function() {
	const k = (await promise_call("getLimitPostLength")).toNumber();
	const msg = 'x'.repeat(k+1)
	failExecute("postProfile", msg);
    });


    // *********************************************************************
    // Stress tests
    // *********************************************************************

    /*
    it("Stress test (long post)", async function() {
	const k = (await promise_call("getLimitPostLength")).toNumber();
	var msg='x'

	var single = await promise_execute("postMessage", msg.repeat(1));
	var multi = await promise_execute("postMessage", msg.repeat(k));

	var cost_single = single.receipt.gasUsed;
	var cost_multi = multi.receipt.gasUsed;
	
	console.log("Single post gasUsed per char", cost_single);
	console.log("Multi  post gasUsed per char", cost_multi/k);
    });
    
    it("Stress test (N posts)", function() {
	var N=200;
	var promiseList = [];
	for (i = 0; i<N; i++) {
	    promise_execute("postMessage", msg0).then(function(result) {
		//console.log("posted", result.tx, "to", result.receipt.blockNumber);
	    });
	}
    });
    */

    
    // *********************************************************************
    // Shutdown 
    // *********************************************************************

    
    it("Try to have non-curator shutdown", function() {
	failExecute("closeLandmarkSite", {from:accounts[1]});
    });
    
    it("Shutdown and verify closed", async function() {
	const curator = await promise_call("getCuratorAddress");
	assert.equal(await promise_call("getIsSiteOpen"), true);
	await promise_execute("closeLandmarkSite", {from:curator});
	assert.equal(await promise_call("getIsSiteOpen"), false);
    });

    it("Post message on shutdown site", async function() {
	failExecute("postMessage", msg0);
    });

    it("Post profile shutdown site", async function() {
	failExecute("postProfile", msg0);
    });
    
});
