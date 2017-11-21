function markBOPVerified(flag) {
  if (flag) {
    $("#verifiedOutput").css('color','green');
    $("#verifiedOutput").html("BP verified!");
  }
  else {
    $("#verifiedOutput").css('color','red');
    $("#verifiedOutput").html("BP <b>NOT</b> verified!");
  }
}


function verifyAddressIsBOP() {
  markBOPVerified(false);
  window.BOPFactory.contractInstance.getBOPCount(function(err, res) {
    if (err) {
        console.log("Error calling BP method: " + err.message);
    }
    else {
      var numBOPs = Number(res);
      for (var i = 0; i < numBOPs; i++) {
        BOPFactory.contractInstance.BOPs(i, function(err, res) {
          if (err) {
              console.log("Error calling BP method: " + err.message);
          }
          else if (BOPVue.BOP.address == res) {
            //we've found a match in the BOPs list in the Factory contract; the address does point to a BOP.
            markBOPVerified(true);
          }
        });
      }
    }
  });
}

function newBOPAddress(newAddress) {
  var BOP = {address:newAddress};
  BOP.contract = web3.eth.contract(BOP_ABI);
  BOP.contractInstance = BOP.contract.at(BOP.address);
  
  BOPVue.newBOP(BOP);
  eventLogVue.newBOP(BOP);
}

function createBOPVue() {
  return new Vue({
    el: '#BOPVue',
    data: {
      BOP:{
        address: "[loading]",
        payer: "[loading]",
        title: "[loading]",
        state: 0,
        worker: "[loading]",
        balance: 0,
        serviceDeposit: 0,
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
        if (web3.eth.defaultAccount == this.BOP.payer)
          this.userIsPayer = true;
        if (web3.eth.defaultAccount == this.BOP.worker)
          this.userIsWorker = true;

        $('[data-toggle="popover"]').popover();
      },
      newBOP: function(BOP) {
        this.BOP.address = BOP.address;
        this.BOP.contract = BOP.contract;
        this.BOP.contractInstance = BOP.contractInstance;
        this.fetchBOPState();
      },
      fetchBOPState: function() {
        this.BOP.contractInstance.getFullState(function(err, res) {
          if (err) {
            console.log(err.message);
          }
          else {
            //can't use 'this' as this is an anonymous function
            BOPVue.updateBOPState(res);
          }
        });
      },
      updateBOPState: function(getStateResult) {
        this.BOP.payer = getStateResult[0].toString();
        this.BOP.title = xssFilters.inHTMLData(getStateResult[1].toString());
        this.BOP.title = truncateTitleIfTooLong(this.BOP.title);
        this.BOP.state = new web3.BigNumber(getStateResult[2].toString());
        this.BOP.worker = getStateResult[3].toString();
        this.BOP.balance = new web3.BigNumber(getStateResult[4].toString());
        this.BOP.serviceDeposit = getStateResult[5].toString();
        this.BOP.amountDeposited = new web3.BigNumber(getStateResult[6].toString());
        this.BOP.amountBurned = new web3.BigNumber(getStateResult[7].toString());
        this.BOP.amountReleased = new web3.BigNumber(getStateResult[8].toString());
        this.BOP.autoreleaseInterval = new web3.BigNumber(getStateResult[9].toString());
        this.BOP.autoreleaseTime = new web3.BigNumber(getStateResult[10].toString());
      }
    },
    computed: {
      secondsUntilAutorelease: function() {
        return this.BOP.autoreleaseTime - this.now;
      }
    }
  });
}

function createEventLogVue() {
  return new Vue({
    el: "#eventLogVue",
    data: {
      events: []
    },
    methods: {
      newBOP: function(BOP) {
        var eventWatcher = BOP.contractInstance.allEvents({fromBlock:window.filterStartBlock});
        eventWatcher.get(function(err, events) {
          if (err) console.log("Error when fetching events:",err);
          else {
            //we have events!
            console.log(events);
            eventLogVue.events = events;
          }
        });
      }
    }
  });
};

function onWeb3Ready() {
  var address = getUrlParameter("address");
  
  newBOPAddress(address);
  verifyAddressIsBOP();
}

window.addEventListener('load', function() {
  $.get("navbar.html", function(data){
    $("#nav-placeholder").replaceWith(data);
  });
  
  //setup Vue that displays and tracks the BOP state.
  window.BOPVue = createBOPVue();
  window.eventLogVue = createEventLogVue();
  
  //interval to keep BOP updated
  window.fetchBOPStateInterval = setInterval(BOPVue.fetchBOPState, 2000);
  //keep BOP 'now' var up to date
  window.BOPVueTickInterval = setInterval(BOPVue.tick, 1000);
  
  //event listener for when the user inputs a new address and hits enter.
  $("#BOPAddressInput").keypress(function(e) {
    if (e.which == 13) {//enter
      var address = $("#BOPAddressInput").val();
      BOPVue.setNewBOP(address);
      verifyAddressIsBOP();
    }
  });
  
  prepareWeb3();
});

//BOP contract method calls

function web3CallbackLogIfError(err, res) {
  if (err) console.log(err.message);
}

function callCommit() {
  BOPVue.BOP.contractInstance.commit({'value':BOPVue.BOP.serviceDeposit}, web3CallbackLogIfError);
}

function callRelease(amountInWei) {
  BOPVue.BOP.contractInstance.release(amountInWei, {'gas':300000}, web3CallbackLogIfError);
}
function releaseFromForm() {
  var amountInEth = $('#release-amount-input').val();
  
  var amountInWei = web3.toWei(amountInEth,'ether');
  if (amountInWei <= 0)
    alert("Error: the amount must be greater than 0.");
  else if (BOPVue.BOP.balance.lessThan(amountInWei))
    alert("Error: the Payment does not contain that much ether!\nRequested release: " + formatWeiValue(amountInWei) + "\nAvailable balance: " + formatWeiValue(BOPVue.BOP.balance));
  else
    callRelease(amountInWei);
}

function callBurn(amountInWei) {
  BOPVue.BOP.contractInstance.burn(amountInWei, {'gas':300000}, web3CallbackLogIfError);
}
function burnFromForm() {
  var amountInEth = $('#burn-amount-input').val();
  
  var amountInWei = web3.toWei(amountInEth,'ether');
  if (amountInWei <= 0)
    alert("Error: the amount must be greater than 0.");
  else if (BOPVue.BOP.balance.lessThan(amountInWei))
    alert("Error: the Payment does not contain that much ether!\nRequested burn: " + formatWeiValue(amountInWei) + "\nAvailable balance: " + formatWeiValue(BOPVue.BOP.balance));
  else
    callBurn(amountInWei);
}

function callAddFunds(includedEth) {
	BOPVue.BOP.contractInstance.addFunds({'value':web3.toWei(includedEth,'ether')}, web3CallbackLogIfError)
}
function addfundsFromForm() {
	var amount = new web3.BigNumber($('#addfunds-amount-input').val());
	callAddFunds(amount);
}

function delayAutorelease() {
  BOPVue.BOP.contractInstance.delayAutorelease(web3CallbackLogIfError);
}

function triggerAutorelease() {
  BOPVue.BOP.contractInstance.triggerAutorelease(web3CallbackLogIfError);
}

function callRecoverFunds() {
  BOPVue.BOP.contractInstance.recoverFunds(web3CallbackLogIfError);
}

function callLogPayerStatement(statement) {
  BOPVue.BOP.contractInstance.logPayerStatement(statement, web3CallbackLogIfError);
}
function logPayerStatementFromForm() {
  var statement = $('#statement-input').val();
  callLogPayerStatement(statement);
}


function callLogWorkerStatement(statement) {
  BOPVue.BOP.contractInstance.logWorkerStatement(statement, web3CallbackLogIfError);
}
function logWorkerStatementFromForm() {
  var statement = $('#statement-input').val();
  callLogWorkerStatement(statement);
}
