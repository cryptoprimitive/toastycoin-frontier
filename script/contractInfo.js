const FILTER_START_BLOCK_ROPSTEN = 2557857; //1941956 set to the earliest block either one of the factory contracts was created on
const FILTER_START_BLOCK = 4435671;
const BOP_FACTORY_ADDRESS = "0x38B394cD27C3b0D865F58a4512b65c7b0ab6DB66";
const BOP_FACTORY_ADDRESS_ROPSTEN = "0xa64be4d79abac02dde1b90edddda21240081a3b6"; //"0xA981e23E9Ff17357dE2a13a9CA36E728322016f0";
const BOP_ADDRESS_ROPSTEN = "0xd2e82c537f9fd13bc4d3e26d684af703aa8df1a2";
const BOP_FACTORY_ABI = [
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "BPs",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "payerOpened",
				"type": "bool"
			},
			{
				"name": "creator",
				"type": "address"
			},
			{
				"name": "commitThreshold",
				"type": "uint256"
			},
			{
				"name": "autoreleaseInterval",
				"type": "uint256"
			},
			{
				"name": "title",
				"type": "string"
			},
			{
				"name": "initialStatement",
				"type": "string"
			}
		],
		"name": "newBP",
		"outputs": [
			{
				"name": "newBPAddr",
				"type": "address"
			}
		],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getBPCount",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "bpAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "payerOpened",
				"type": "bool"
			},
			{
				"indexed": false,
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "deposited",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "commitThreshold",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "autoreleaseInterval",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "title",
				"type": "string"
			},
			{
				"indexed": false,
				"name": "initialStatement",
				"type": "string"
			}
		],
		"name": "NewBurnablePayment",
		"type": "event"
	}
];

const BOP_ABI = [
	{
		"constant": true,
		"inputs": [],
		"name": "payer",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "delayAutorelease",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "release",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "commit",
		"outputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "burn",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "title",
		"outputs": [
			{
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "worker",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "amountBurned",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "autoreleaseInterval",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "statement",
				"type": "string"
			}
		],
		"name": "logPayerStatement",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "triggerAutorelease",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getFullState",
		"outputs": [
			{
				"name": "",
				"type": "uint8"
			},
			{
				"name": "",
				"type": "address"
			},
			{
				"name": "",
				"type": "address"
			},
			{
				"name": "",
				"type": "string"
			},
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "addFunds",
		"outputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "recoverFunds",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "autoreleaseTime",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "state",
		"outputs": [
			{
				"name": "",
				"type": "uint8"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "amountReleased",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "commitThreshold",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "statement",
				"type": "string"
			}
		],
		"name": "logWorkerStatement",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "amountDeposited",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"name": "_payerIsOpening",
				"type": "bool"
			},
			{
				"name": "creator",
				"type": "address"
			},
			{
				"name": "_commitThreshold",
				"type": "uint256"
			},
			{
				"name": "_autoreleaseInterval",
				"type": "uint256"
			},
			{
				"name": "_title",
				"type": "string"
			},
			{
				"name": "initialStatement",
				"type": "string"
			}
		],
		"payable": true,
		"stateMutability": "payable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "contractAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "payerOpened",
				"type": "bool"
			},
			{
				"indexed": false,
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "commitThreshold",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "autoreleaseInterval",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "title",
				"type": "string"
			}
		],
		"name": "Created",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "from",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "statement",
				"type": "string"
			}
		],
		"name": "PayerStatement",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "statement",
				"type": "string"
			}
		],
		"name": "WorkerStatement",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "FundsRecovered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "committer",
				"type": "address"
			}
		],
		"name": "Committed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsBurned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsReleased",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "Closed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "Unclosed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "AutoreleaseDelayed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "AutoreleaseTriggered",
		"type": "event"
	}
];
