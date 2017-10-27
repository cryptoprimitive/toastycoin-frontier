function processAndAddBOP(address, state) {
  var BOP = {
    address: address,
    payer: state[0].toString(),
    title: truncateTitleIfTooLong(xssFilters.inHTMLData(state[1].toString())),
    state: new web3.BigNumber(state[2]),
    worker: state[3].toString(),
    balance: new web3.BigNumber(state[4]),
    serviceDeposit: new web3.BigNumber(state[5]),
    amountDeposited: new web3.BigNumber(state[6]),
    amountBurned: new web3.BigNumber(state[7]),
    amountReleased: new web3.BigNumber(state[8]),
    autoreleaseInterval: new web3.BigNumber(state[9]),
    autoreleaseTime: new web3.BigNumber(state[10])
  };
  browseVue.BOPs.push(BOP);
}

//Here we use an array in the factory to track BOPs. We could filter for newBOP events instead
//but this has proved unreliable in the past, so I'm hesitant to rely on it.
//See https://github.com/MetaMask/metamask-extension/issues/2114
function fetchAllBOPs() {
  //Create a BOP contract; later this will be called with each BOP's address to make a contractInstance
  var BOPContract = web3.eth.contract(BOP_ABI);
  
  //Find number of BOPs stored in Factory "BOPs" array
  BOPFactory.contractInstance.getBOPCount(function(err,res){
    if (err) {
      console.log("Error calling BOP method: " + err.message);
    }
    else {
      console.log(res);
      var numBOPs = new web3.BigNumber(res);
      //Now we have the BOP count. Iterate through and get address and info for each BOP.
      var BOPs = [];
      for (var i=0; i<numBOPs; i++) {
        BOPFactory.contractInstance.BOPs(i, function(err, res) {
          if (err) {
            console.log("Error calling BOP method: " + err.message);
          }
          else{
            var BOPAddress = res;
            //With the address, we can now instantiate a contractInstance for the BOP and call getFullState.
            (function(BOPAddress) {
              web3.eth.getCode(BOPAddress, function(err, res){
                if(err) {
                  console.log("Error calling BOP method: " + err.message);
                }
                else if(res !== "0x") {//Ignore all BOPs that have been recoverFunds'd (suicided)
                  var BOPContractInstance = BOPContract.at(BOPAddress);
                  BOPContractInstance.getFullState(function(err, res) {
                    if(err) {
                      console.log("Error calling BOP method: " + err.message);
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
      intervalHandle: null
    },
    methods: {
      goToInteractPage: function(address) {
        window.location.href = "interact.html?address=" + address
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
  
  if (typeof web3 === 'undefined') {
    $('#noProviderWarningDiv').show();
  }
  else {//A web3 provider is present; we can continue
    $('#web3Div').show();
    
    //window.web3 = new Web3(web3.currentProvider);
    window.BOPFactory = {};
    web3.version.getNetwork((err, netID) => {
      if (netID === '1') {
        console.log("You are on the Ethereum mainnet!");
        window.etherscanURL = "https://etherscan.io/"
        window.etherscanAPIURL = "https://api.etherscan.io/api?";
        BOPFactory.address = BOP_FACTORY_ADDRESS;
        onWeb3Ready();
      }
      else if (netID === '3') {
        console.log("You are on the Ropsten net!");
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