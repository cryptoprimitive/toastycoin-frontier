function processAndAddBP(address, state) {
  var BP = {
    address: address,
    state: state[0].toString(),
    payer: state[1].toString(),
    worker: state[2].toString(),
    title: truncateTitleIfTooLong(xssFilters.inHTMLData(state[3].toString())),
    balance: new web3.BigNumber(state[4]),
    commitThreshold: new web3.BigNumber(state[5]),
    amountDeposited: new web3.BigNumber(state[6]),
    amountBurned: new web3.BigNumber(state[7]),
    amountReleased: new web3.BigNumber(state[8]),
    autoreleaseInterval: new web3.BigNumber(state[9]),
    autoreleaseTime: new web3.BigNumber(state[10])
  };
  browseVue.pushBPAndSort(BP);
}

function applyNewCompareCode() {
  browseVue.compareCode = $("#compare-code-input").val();
  browseVue.sortBPs();
}

//Here we use an array in the factory to track BPs. We could filter for newBP events instead
//but this has proved unreliable in the past, so I'm hesitant to rely on it.
//See https://github.com/MetaMask/metamask-extension/issues/2114
function fetchAllBPs() {
  //Create a BP contract; later this will be called with each BP's address to make a contractInstance
  var BPContract = web3.eth.contract(BP_ABI);
  
  //Find number of BPs stored in Factory "BPs" array
  BPFactory.contractInstance.getBPCount(function(err,res){
    if (err) {
      console.log("Error calling BP method: " + err.message);
    }
    else {
      console.log(res);
      var numBPs = new web3.BigNumber(res);
      //Now we have the BP count. Iterate through and get address and info for each BP.
      var BPs = [];
      for (var i=0; i<numBPs; i++) {
        BPFactory.contractInstance.BPs(i, function(err, res) {
          if (err) {
            console.log("Error calling BP method: " + err.message);
          }
          else{
            var BPAddress = res;
            //With the address, we can now instantiate a contractInstance for the BP and call getFullState.
            (function(BPAddress) {
              web3.eth.getCode(BPAddress, function(err, res){
                if(err) {
                  console.log("Error calling BP method: " + err.message);
                }
                else if(res !== "0x") {//Ignore all BPs that have been recoverFunds'd (suicided)
                  var BPContractInstance = BPContract.at(BPAddress);
                  BPContractInstance.getFullState(function(err, res) {
                    if(err) {
                      console.log("Error calling BP method: " + err.message);
                    }
                    else {
                      var BPFullState = res;
                      processAndAddBP(BPAddress, BPFullState);
                    }
                  });
                }
              });
            })(BPAddress);
          }
        });
      }
    }
  });
}

function createBrowseVue() {
  return new Vue({
    el: "#browseVue",
    data: {
      BPs: [],
      intervalHandle: null,
      compareCode:
`// Sort by balance, descending
compareResult = b.balance - a.balance

//a and b represent two Payments to compare, and have the following members:
//  address (string)
//  payer (string)
//  title (string)
//  state (0, 1, or 2)
//  worker (string)
//  balance (BigNumber, wei)
//  serviceDeposit (BigNumber, wei)
//  amountDeposited (BigNumber, wei)
//  amountBurned (BigNumber, wei)
//  amountReleased (BigNumber, wei)
//  autoreleaseInterval (BigNumber, seconds)
//  autoreleaseTime (BigNumber, unix time)
`,
    },
    methods: {
      goToInteractPage: function(address) {
        window.open("interact.html?address=" + address, '_blank');
      },
      pushBPAndSort: function(BP) {
        this.BPs.push(BP);
        this.sortBPs();
      },
      sortBPs: function() {
        this.BPs.sort(function(a, b) {
          var compareResult;
          eval(browseVue.compareCode);
          return compareResult;
        });
      }
    },
    updated: function() {
      $('[data-toggle="popover"]')
        .on('click',function(e){
          e.preventDefault();
        })
        .popover();
    }
  });
}

function onWeb3Ready() {
  BPFactory.ABI = BP_FACTORY_ABI;
  BPFactory.contract = web3.eth.contract(BPFactory.ABI);
  BPFactory.contractInstance = BPFactory.contract.at(BPFactory.address);
  
  fetchAllBPs();
}

window.addEventListener('load', function() {
  $.get("navbar.html", function(data){
    $("#nav-placeholder").replaceWith(data);
  });
  
  window.browseVue = createBrowseVue();
  
  $("#compare-code-modal").on('shown.bs.modal', function (e) {
    $("#compare-code-input").val(browseVue.compareCode);
  });
  
  prepareWeb3();
});