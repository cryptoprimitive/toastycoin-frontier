function formatWeiValue(wei) {
    if (typeof web3 === "undefined") {
        var web3 = new Web3();
    }
    var ether = web3.fromWei(wei, "ether");
    if (wei.toString().length > 17)
        return ether + " ETH";
    else if (wei.toString().length > 14)
        return ether * 1000 + " mETH";
    else if (wei.toString().length > 11)
        return ether * 1000000 + " \u00B5ETH";
    else if (wei.toString().length > 8)
        return ether * 1000000000 + " nETH";
    else if (wei.toString().length > 5)
        return ether * 1000000000000 + " pETH";
    else return wei.toString() + " wei";
}

function prepareBOPFactoryContract() {
    BOPFactory.ABI = BOP_FACTORY_ABI;
    BOPFactory.contract = web3.eth.contract(BOPFactory.ABI);
    BOPFactory.contractInstance = BOPFactory.contract.at(BOPFactory.address);
}
var web3 = typeof web3 === 'undefined' ? undefined : web3;

function prepareWeb3() {
    if (typeof web3 === 'undefined') {
        var ethereumProvider = metamask.createDefaultProvider();
        web3 = new Web3();
        web3.setProvider(ethereumProvider);
    }
    console.log(web3.version)
    $('#web3Div').show();
    var accountIntervalID = setInterval(function() {
        if (web3.eth.accounts.length == 0) {
            $('#web3LockedWarning').show();
        } else {
            $('#web3LockedWarning').hide();
            web3.eth.createDefaultProvidertAccount = web3.eth.accounts[0];
            clearInterval(accountIntervalID);
        }
    }, 250)

    window.BOPFactory = {};
    web3.version.getNetwork((err, netID) => {
        if (netID !== '3') {
            if (netID !== '1') {
                web3.setProvider(new Web3.providers.HttpProvider("http://35.153.227.213:8545"));

            }
            console.log("You are on the Ethereum mainnet!");
            window.filterStartBlock = FILTER_START_BLOCK;
            window.etherscanURL = "https://etherscan.io/"
            window.etherscanAPIURL = "https://api.etherscan.io/api?";
            BOPFactory.address = BOP_FACTORY_ADDRESS;
            prepareBOPFactoryContract();
            onWeb3Ready();
        } else if (netID === '3') {
            console.log("You are on the Ropsten net!");
            window.filterStartBlock = FILTER_START_BLOCK_ROPSTEN;
            window.etherscanURL = "https://ropsten.etherscan.io/";
            window.etherscanAPIURL = "https://ropsten.etherscan.io/api?";
            BOPFactory.address = BOP_FACTORY_ADDRESS_ROPSTEN;
            prepareBOPFactoryContract();
            $('#ropstenWarning').show();
            onWeb3Ready();
        }
    });
}

function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1));
    var sURLVariables = sPageURL.split('&');

    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameter = sURLVariables[i].split('=');

        if (sParameter[0] === sParam) {
            return sParameter[1] === undefined ? true : sParameter[1];
        }
    }
}

function truncateTitleIfTooLong(title) {
    if (title.length > 100)
        return title.substring(0, 100) + "...";
    else return title;
}

function copyTextToClipboard(text) {
    var textArea = document.createElement("textarea");

    //
    // *** This styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a flash,
    // so some of these are just precautions. However in IE the element
    // is visible whilst the popup box asking the user for permission for
    // the web page to copy to the clipboard.
    //

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';


    textArea.value = text;

    document.body.appendChild(textArea);

    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
    } catch (err) {
        console.log('Oops, unable to copy');
    }

    document.body.removeChild(textArea);
}