function onWeb3Ready() {}

function handleNewBOPResult(err, res) {
  if (err) alert(err.message);
  else {
    console.log(res);
    window.createResultListVue.newResult(res);
  }
}
function callNewBOP(valueInEth, payer, serviceDepositInEth, autoreleaseIntervalInDays, title, initialPayerStatement) {
    var valueInWei = web3.toWei(valueInEth, 'ether');
    var serviceDepositInWei = web3.toWei(serviceDepositInEth, 'ether');
    var autoreleaseIntervalInSeconds = autoreleaseIntervalInDays*24*60*60;

    BOPFactory.contractInstance.newBurnableOpenPayment(payer, serviceDepositInWei, autoreleaseIntervalInSeconds, title, initialPayerStatement, {'value': valueInWei, 'gas': 1500000}, handleNewBOPResult);
}

function newBOPFromForm() {
  var valueInEth = $("#NewBOPForm #paymentAmountInput").val();
  if (valueInEth == '') {
    alert("Must specify payment amount!");
    return;
  }
  valueInEth = Number(valueInEth);

  var payer = $("#NewBOPForm #payerInput").val();
  if (payer == '') {
    alert("Must specify payer!");
    return;
  }

  var serviceDepositInEth = $("#NewBOPForm #serviceDepositInput").val();
  console.log(serviceDepositInEth);
  if (serviceDepositInEth == '') {
    alert("Must specify commit threshold!");
    return;
  }
  serviceDepositInEth = Number(serviceDepositInEth);

  var autoreleaseIntervalInDays = $("#NewBOPForm #autoreleaseTimerInput").val();
  if (autoreleaseIntervalInDays == '') {
    alert("Must specify a default timeout length!");
    return;
  }
  autoreleaseIntervalInDays = Number(autoreleaseIntervalInDays);

  var title = $("#NewBOPForm #titleInput").val();
  if (title == '') {
    alert("BP must have a title!");
    return;
  }
  
  var initialPayerStatement = $("#NewBOPForm #initialStatementInput").val();
  if (initialPayerStatement == '') {
    if (!confirm("Initial payer statement is empty! Are you sure you want to open a BP without an initial statement?")) {
      return;
    }
  }
  
  callNewBOP(valueInEth, payer, serviceDepositInEth, autoreleaseIntervalInDays, title, initialPayerStatement);
}

function populatePayerInputFromMetamask() {
  if ($("#payerInput").val() == "") {
    $("#payerInput").val(web3.eth.defaultAccount)
  }
}

function updateLengthChecker() {
  var length = $('#titleInput').val().length;
  if (length <= 100) {
    $('#lengthCheckerOutput').html("<font style='color:blue'>" + length.toString() + "/100</font>");
  }
  else {
    $('#lengthCheckerOutput').html("<font style='color:red'>" + length.toString() + "/100<br><b>Caution!</b> Although the full title will be stored in the BP, Toastycoin only displays the first 100 characters! Use the Initial Payer Statement to include more details.</font>");
  }
}

function createCreateResultListVue() {
  return new Vue({
    el: "#createResultList",
    data: {
      createResults: [],
      intervalHandle: null
    },
    methods: {
      newResult(txHash) {
        this.createResults.push({
          txHash: txHash,
          mined: false,
          BOPAddress: null
        });
      },
      createTxMined(txReceipt) {
        var txHash = txReceipt.transactionHash;
        for (var i=0; i<this.createResults.length; i++) {
          if (this.createResults[i].txHash == txHash) {
            this.createResults[i].mined = true;
            console.log(txReceipt);
            this.createResults[i].BOPAddress = txReceipt.logs[0].address;
            break;
          }
        }
      },
      tick() {
        for (var i=0; i<this.createResults.length; i++) {
          //if not marked as mined, check now to see if it has been by now
          if (!this.createResults[i].mined) {
            web3.eth.getTransactionReceipt(this.createResults[i].txHash, function(err, res) {
              if (res != null) {
                //it's been mined; update dictionary
                //can't use 'this', as we're now in an anonymous function
                createResultListVue.createTxMined(res);
              }
            });
          }
        }
      }
    },
    mounted: function() {
      this.tick();
      this.intervalHandle = setInterval(this.tick, 1000);
    },
  });
}

window.addEventListener('load', function() {
  $.get("navbar.html", function(data){
    $("#nav-placeholder").replaceWith(data);
  });
  
  window.createResultListVue = createCreateResultListVue();
  
  $('[data-toggle="popover"]').popover();
  
  prepareWeb3();
});