function markBOPVerified(flag) {
  if (flag) {
    $("#verifiedOutput").css('color','green');
    $("#verifiedOutput").html("BOP verified!");
  }
  else {
    $("#verifiedOutput").css('color','red');
    $("#verifiedOutput").html("BOP <b>NOT</b> verified!");
  }
}


function verifyAddressIsBOP() {
  markBOPVerified(false);
  window.BOPFactory.contractInstance.getBOPCount(function(err, res) {
    if (err) {
        console.log("Error calling BOP method: " + err.message);
    }
    else {
      var numBOPs = Number(res);
      for (var i = 0; i < numBOPs; i++) {
        BOPFactory.contractInstance.BOPs(i, function(err, res) {
          if (err) {
              console.log("Error calling BOP method: " + err.message);
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
        if (web3.eth.accounts[0] == this.BOP.payer)
          this.userIsPayer = true;
        if (web3.eth.accounts[0] == this.BOP.worker)
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
  BOPFactory.ABI = BOP_FACTORY_ABI;
  BOPFactory.contract = web3.eth.contract(BOPFactory.ABI);
  BOPFactory.contractInstance = BOPFactory.contract.at(BOPFactory.address);
  
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
  
  if (typeof web3 === 'undefined') {
    $('#noProviderWarningDiv').show();
  }
  else {//A web3 provider is present; we can continue
    $('#web3Div').show();
    web3.eth.defaultAccount = web3.eth.accounts[0];
    
    window.BOPFactory = {};
    web3.version.getNetwork((err, netID) => {
      if (netID === '1') {
        console.log("You are on the Ethereum mainnet!");
        window.filterStartBlock = FILTER_START_BLOCK;
        window.etherscanURL = "https://etherscan.io/"
        window.etherscanAPIURL = "https://api.etherscan.io/api?";
        BOPFactory.address = BOP_FACTORY_ADDRESS;
        onWeb3Ready();
      }
      else if (netID === '3') {
        console.log("You are on the Ropsten net!");
        window.filterStartBlock = FILTER_START_BLOCK_ROPSTEN;
        window.etherscanURL = "https://ropsten.etherscan.io/";
        window.etherscanAPIURL = "https://ropsten.etherscan.io/api?";
        BOPFactory.address = BOP_FACTORY_ADDRESS_ROPSTEN;
        onWeb3Ready();
      }
      else{
        alert("You aren't on the Ethereum main or Ropsten net! Try changing your metamask options to connect to the main or Ropsten network, then refresh the page.");
      }
    });
  }
});

//BOP contract method calls

function web3CallbackLogIfError(err, res) {
  if (err) console.log(err.message);
}

function callCommit() {
  BOPVue.BOP.contractInstance.commit({'value':BOPVue.BOP.serviceDeposit}, web3CallbackLogIfError);
}

function callRelease(amountInEth) {
  BOPVue.BOP.contractInstance.release(web3.toWei(amountInEth,'ether'), {'gas':300000}, web3CallbackLogIfError);
}
function releaseFromForm() {
  var amount = new web3.BigNumber($('#release-amount-input').val());
  callRelease(amount);
}

function callBurn(amountInEth) {
  BOPVue.BOP.contractInstance.burn(web3.toWei(amountInEth,'ether'), web3CallbackLogIfError);
}
function burnFromForm() {
  var amount = new web3.BigNumber($('#burn-amount-input').val());
  callBurn(amount);
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