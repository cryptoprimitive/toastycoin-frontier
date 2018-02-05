function processAndAddBOP(address, state) {
  var BOP = {
    address: address,
    state: state[0].toString(),
    payer: state[1].toString(),
    worker: state[2].toString(),
    title: truncateTitleIfTooLong(xssFilters.inHTMLData(state[3].toString())),
    balance: new web3.BigNumber(state[4]),
    serviceDeposit: new web3.BigNumber(state[5]),
    amountDeposited: new web3.BigNumber(state[6]),
    amountBurned: new web3.BigNumber(state[7]),
    amountReleased: new web3.BigNumber(state[8]),
    autoreleaseInterval: new web3.BigNumber(state[9]),
    autoreleaseTime: new web3.BigNumber(state[10])
  };
  browseVue.pushBOPAndSort(BOP);
}

function applyNewCompareCode() {
  browseVue.compareCode = $("#compare-code-input").val();
  browseVue.sortBOPs();
}

//Here we use an array in the factory to track BOPs. We could filter for newBOP events instead
//but this has proved unreliable in the past, so I'm hesitant to rely on it.
//See https://github.com/MetaMask/metamask-extension/issues/2114
function fetchAllBOPs() {
  //Create a BOP contract; later this will be called with each BOP's address to make a contractInstance
  var BOPContract = web3.eth.contract(BOP_ABI);
  
  //Find number of BOPs stored in Factory "BOPs" array
  BOPFactory.contractInstance.getBPCount(function(err,res){
    if (err) {
      console.log("Error calling BP method: " + err.message);
    }
    else {
      console.log(res);
      var numBOPs = new web3.BigNumber(res);
      //Now we have the BOP count. Iterate through and get address and info for each BOP.
      var BOPs = [];
      for (var i=0; i<numBOPs; i++) {
        BOPFactory.contractInstance.BPs(i, function(err, res) {
          if (err) {
            console.log("Error calling BP method: " + err.message);
          }
          else{
            var BOPAddress = res;
            //With the address, we can now instantiate a contractInstance for the BOP and call getFullState.
            (function(BOPAddress) {
              web3.eth.getCode(BOPAddress, function(err, res){
                if(err) {
                  console.log("Error calling BP method: " + err.message);
                }
                else if(res !== "0x") {//Ignore all BOPs that have been recoverFunds'd (suicided)
                  var BOPContractInstance = BOPContract.at(BOPAddress);
                  BOPContractInstance.getFullState(function(err, res) {
                    if(err) {
                      console.log("Error calling BP method: " + err.message);
                    }
                    else {
                      var BOPFullState = res;
                      processAndAddBOP(BOPAddress, BOPFullState);
                    }
                  });
                }
              });
            })(BOPAddress);
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
      BOPs: [],
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
      pushBOPAndSort: function(BOP) {
        this.BOPs.push(BOP);
        this.sortBOPs();
      },
      sortBOPs: function() {
        this.BOPs.sort(function(a, b) {
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
  BOPFactory.ABI = BOP_FACTORY_ABI;
  BOPFactory.contract = web3.eth.contract(BOPFactory.ABI);
  BOPFactory.contractInstance = BOPFactory.contract.at(BOPFactory.address);
  
  fetchAllBOPs();
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