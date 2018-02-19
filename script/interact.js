function markBPVerified(flag) {
  if (flag) {
    $("#verifiedOutput").css('color','green');
    $("#verifiedOutput").html("BP verified!");
  }
  else {
    $("#verifiedOutput").css('color','red');
    $("#verifiedOutput").html("BP <b>NOT</b> verified!");
  }
}


function verifyAddressIsBP() {
  markBPVerified(false);
  window.BPFactory.contractInstance.getBPCount(function(err, res) {
    if (err) {
        console.log("Error calling BP method: " + err.message);
    }
    else {
      var numBPs = Number(res);
      for (var i = 0; i < numBPs; i++) {
        BPFactory.contractInstance.BPs(i, function(err, res) {
          if (err) {
              console.log("Error calling BP method: " + err.message);
          }
          else if (BPVue.BP.address == res) {
            //we've found a match in the BPs list in the Factory contract; the address does point to a BP.
            markBPVerified(true);
          }
        });
      }
    }
  });
}

function newBPAddress(newAddress) {
  var BP = {address:newAddress};
  BP.contract = web3.eth.contract(BP_ABI);
  BP.contractInstance = BP.contract.at(BP.address);
  BPVue.newBP(BP);
  eventLogVue.newBP(BP);
}
function createBPVue() {
  return new Vue({
    el: '#BPVue',
    data: {
      BP:{
        address: "[loading]",
        payer: "[loading]",
        title: "[loading]",
        state: 0,
        worker: "[loading]",
        balance: 0,
        commitThreshold: 0,
        amountDeposited: 0,
        amountBurned: 0,
        amountReleased: 0,
        autoreleaseInterval: 0,
        autoreleaseTime: 0
      },
      now: Math.floor(Date.now()/1000),
      userIsPayer: false,
      userIsWorker: false,
    },
    methods: {
      tick: function() {
        //fetch current time
        this.now = Math.floor(Date.now()/1000);
        
        //check is web3 user is payer or worker
        if (web3.eth.defaultAccount == this.BP.payer)
          this.userIsPayer = true;
        if (web3.eth.defaultAccount == this.BP.worker)
          this.userIsWorker = true;

        $('[data-toggle="popover"]').popover();
      },
      newBP: function(BP) {
        this.BP.address = BP.address;
        this.BP.contract = BP.contract;
        this.BP.contractInstance = BP.contractInstance;
        this.fetchBPState();
      },
      fetchBPState: function() {
        this.BP.contractInstance.getFullState(function(err, res) {
          if (err) {
            console.log(err.message);
          }
          else {
            //can't use 'this' as this is an anonymous function
            BPVue.updateBPState(res);
          }
        });
      },
      //(0-state, 1-payer, 2-worker, 3-title, 4-balance, 5-commitThreshold, 6-amountDeposited, 7-amountBurned, 8-amountReleased, 9-autoreleaseInterval, 10-autoreleaseTime);
      updateBPState: function(getStateResult) {
        this.BP.state = getStateResult[0].toString();
        this.BP.payer = getStateResult[1].toString();
        this.BP.worker = getStateResult[2].toString();
        this.BP.title = truncateTitleIfTooLong(xssFilters.inHTMLData(getStateResult[3].toString()));
        this.BP.balance = new web3.BigNumber(getStateResult[4].toString());
        this.BP.commitThreshold = new web3.BigNumber(getStateResult[5].toString())
        this.BP.amountDeposited = new web3.BigNumber(getStateResult[6].toString());
        this.BP.amountBurned = new web3.BigNumber(getStateResult[7].toString());
        this.BP.amountReleased = new web3.BigNumber(getStateResult[8].toString());
        this.BP.autoreleaseInterval = new web3.BigNumber(getStateResult[9].toString());
        this.BP.autoreleaseTime = new web3.BigNumber(getStateResult[10].toString());  
      }
    },
    computed: {
      secondsUntilAutorelease: function() {
        return this.BP.autoreleaseTime - this.now;
      }
    }
  });
}

function getBlockCallback(err, blockInfo) {
  if (err) console.log("Error when fetching block info:", err);
  else {
    eventLogVue.events.forEach(function(e) {
      if (e.blockNumber == blockInfo.number) {
        e.timestamp = blockInfo.timestamp;
      }
    });
  }
}

function createEventLogVue() {
  return new Vue({
    el: "#eventLogVue",
    data: {
      events: []
    },
    methods: {
      newBP: function(BP) {
        var eventWatcher = BP.contractInstance.allEvents({fromBlock:window.filterStartBlock});
        eventWatcher.get(function(err, events) {
          if (err) console.log("Error when fetching events:",err);
          else {
            //console.log(events);
            events.forEach(function(e) {
              web3.eth.getBlock(e.blockNumber, getBlockCallback);
              e.timestamp = 0;
            });
            eventLogVue.events = events;
          }
        }); 
      }
    }
  });
};

function onWeb3Ready() {
  var address = getUrlParameter("address");
  
  newBPAddress(address);
  verifyAddressIsBP();
}
window.addEventListener('load', function() {
  $.get("navbar.html", function(data){
    $("#nav-placeholder").replaceWith(data);
  });
  
  //setup Vue that displays and tracks the BP state.
  window.BPVue = createBPVue();

  window.eventLogVue = createEventLogVue();
  
  //interval to keep BP updated
  window.fetchBPStateInterval = setInterval(BPVue.fetchBPState, 2000);
  //keep BP 'now' var up to date
  window.BPVueTickInterval = setInterval(BPVue.tick, 1000);
  
  //event listener for when the user inputs a new address and hits enter.
  $("#BPAddressInput").keypress(function(e) {
    if (e.which == 13) {//enter
      var address = $("#BPAddressInput").val();
      BPVue.setNewBP(address);
      verifyAddressIsBP();
    }
  });
  
  prepareWeb3();
});
//BP contract method calls

function web3CallbackLogIfError(err, res) {
  if (err) console.log(err.message);
}

function callCommit() {
  BPVue.BP.contractInstance.commit({'value':BPVue.BP.commitThreshold}, web3CallbackLogIfError);
}

function callRelease(amountInWei) {
  BPVue.BP.contractInstance.release(amountInWei, {'gas':300000}, web3CallbackLogIfError);
}
function releaseFromForm() {
  var amountInEth = $('#release-amount-input').val();
  
  var amountInWei = web3.toWei(amountInEth,'ether');
  if (amountInWei <= 0)
    alert("Error: the amount must be greater than 0.");
  else if (BPVue.BP.balance.lessThan(amountInWei))
    alert("Error: the Payment does not contain that much ether!\nRequested release: " + formatWeiValue(amountInWei) + "\nAvailable balance: " + formatWeiValue(BPVue.BP.balance));
  else
    callRelease(amountInWei);
}

function callBurn(amountInWei) {
  BPVue.BP.contractInstance.burn(amountInWei, {'gas':300000}, web3CallbackLogIfError);
}
function burnFromForm() {
  var amountInEth = $('#burn-amount-input').val();
  
  var amountInWei = web3.toWei(amountInEth,'ether');
  if (amountInWei <= 0)
    alert("Error: the amount must be greater than 0.");
  else if (BPVue.BP.balance.lessThan(amountInWei))
    alert("Error: the Payment does not contain that much ether!\nRequested burn: " + formatWeiValue(amountInWei) + "\nAvailable balance: " + formatWeiValue(BPVue.BP.balance));
  else
    callBurn(amountInWei);
}

function callAddFunds(includedEth) {
	BPVue.BP.contractInstance.addFunds({'value':web3.toWei(includedEth,'ether')}, web3CallbackLogIfError)
}
function addfundsFromForm() {
	var amount = new web3.BigNumber($('#addfunds-amount-input').val());
	callAddFunds(amount);
}

function delayAutorelease() {
  BPVue.BP.contractInstance.delayAutorelease(web3CallbackLogIfError);
}

function triggerAutorelease() {
  BPVue.BP.contractInstance.triggerAutorelease(web3CallbackLogIfError);
}

function callRecoverFunds() {
  BPVue.BP.contractInstance.recoverFunds(web3CallbackLogIfError);
}

function callLogPayerStatement(statement) {
  BPVue.BP.contractInstance.logPayerStatement(statement, web3CallbackLogIfError);
}
function logPayerStatementFromForm() {
  var statement = $('#statement-input').val();
  callLogPayerStatement(statement);
}


function callLogWorkerStatement(statement) {
  BPVue.BP.contractInstance.logWorkerStatement(statement, web3CallbackLogIfError);
}
function logWorkerStatementFromForm() {
  var statement = $('#statement-input').val();
  callLogWorkerStatement(statement);
}
