Vue.component('eth-address-input', {
  template: '<input size="44">'
});

Vue.component('eth-address-output', {
  props: ['address'],
  computed: {
    etherscanAddressURL: function() {
      return window.etherscanURL + "address/" + this.address;
    },
    popoverHtml: function() {
      return "<font style='font-size:0.6em'>" + this.address + "</font><br><div class='row' style='border:0;padding:0;display:inline-block'><div class='col-sm-6' style='border:0;padding:0;display:inline-block'><button class='btn btn-basic' style='background-color:white' onclick='copyTextToClipboard(" + '"' + this.address + '"' + ")'><img src='resources/copy_icon.png' width=20></button></div><div class='col-sm-6' style='border:0;padding:0;display:inline-block'><a href='" + this.etherscanAddressURL + "' target='_blank' class='btn btn-basic' style='background-color:white;border:1'><img src='resources/chain_icon.png' width=20></button></div></div>";
    },
    formattedAddress: function() {
      return this.address.substring(0,10) + "...";
    }
  },
  template: "<a data-toggle='popover' data-placement='bottom' data-html='true' :data-content='popoverHtml' style='cursor:pointer'>{{formattedAddress}}</a>"
});

Vue.component('duration-output', {
  props: ['seconds'],
  computed: {
    formattedInterval: function() {
      return humanizeDuration(this.seconds*1000, {largest:2});
    }
  },
  template: "<span>{{formattedInterval}}</span>"
});

Vue.component('ether-output', {
  props: ['wei'],
  computed: {
    formatted: function() {
      return formatWeiValue(this.wei);
    }
  },
  template: "<span>{{formatted}}</span>"
});

Vue.component('bp-state-output', {
  props: ['state'],
  computed: {
    formattedState: function() {
      if (this.state == 0)
        return "PayerOpened";
      else if (this.state == 1)
          return "WorkerOpened";
      else if (this.state == 2)
        return "Committed";
      else if (this.state == 3)
        return "Closed";
    },
    color: function() {
      if (this.state == 0)
        return "#ccffcc";
      else if (this.state == 1)
          return "#ccffcc";
      else if (this.state == 2)
        return "cyan";
      else if (this.state == 3)
        return "#aaaaaa";
    }
  },
  template: "<div class='well well-sm' style='display:inline-block;margin-bottom:0' v-bind:style='{backgroundColor:color}'><h3 style='margin-top:0;margin-bottom:0'>{{formattedState}}</h3></div>"
});

Vue.component('create-result-row', {
  props: ['result'],
  data: function() {
    return {
      etherscanURL: window.etherscanURL
    }
  },
  template:
`<div v-if="!(this.result.mined)">Waiting for transaction to be mined: <a target="_blank" :href="this.etherscanURL + 'tx/' + this.result.txHash">{{result.txHash}}</a></div>
<div v-else><a target="_blank" :href="'interact.html?address=' + this.result.BPAddress">BP created!</a></div>
`
});

Vue.component('blocknum-output', {
  props: ['blocknum','timestamp'],
  computed: {
    formattedBlocknum: function() {
      var blocknumStr = this.blocknum.toString();
      return blocknumStr.slice(-9,-6) +"_"+ blocknumStr.slice(-6,-3) +"_"+ blocknumStr.slice(-3);
    },
    formattedTimestamp: function() {
      return moment.unix(this.timestamp).format("YYYY.MM.DD HH:mm");
    }
  },
  template: `<span style="font-size:0.7rem">@block {{formattedBlocknum}} (~{{formattedTimestamp}})</span>`
});

Vue.component('bp-event-row', {
  props: ['event'],
  computed: {
    formattedPayerStatement: function() {
      return "Payer Statement<br><div class='well well-sm' style='margin-bottom:0;background-color:#aaffff'>"+xssFilters.inHTMLData(this.event.args.statement).replace(/(?:\r\n|\r|\n)/g, '<br />') + "</div>";
    },
    formattedWorkerStatement: function() {
      return "Worker Statement<br><div class='well well-sm' style='margin-bottom:0;background-color:#aaffff'>"+xssFilters.inHTMLData(this.event.args.statement).replace(/(?:\r\n|\r|\n)/g, '<br />') + "</div>";
    },
    formattedCommit: function() {
      return (  BPVue.BP.payer == this.event.args.committer) ? '<span>Payer committed to the BP</span>' : '<span>Worker committed to the BP<span>';
    }
  },
  template:
`
<div v-if="this.event.event == 'Created'" align='center'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#dddddd;display:inline-block'>BP created.</div></div>
<div v-else-if="this.event.event == 'FundsAdded'" align='center'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#ccccff;display:inline-block'><ether-output :wei='event.args.amount'></ether-output> deposited by <eth-address-output :address='event.args.from'></eth-address-output>.</div></div>
<div v-else-if="this.event.event == 'PayerStatement'" align='left'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#ccffff;display:inline-block;max-width:50%' v-html='formattedPayerStatement'></div></div>
<div v-else-if="this.event.event == 'WorkerStatement'" align='right'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#ccffff;display:inline-block;max-width:50%' v-html='formattedWorkerStatement'></div></div>
<div v-else-if="this.event.event == 'FundsRecovered'" align='left'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#ff8888;display:inline-block'>Payer cancelled the BP and recovered the funds.</div></div>
<div v-else-if="this.event.event == 'Committed'" align='center'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#ccffcc;display:inline-block' v-html='formattedCommit'></div></div>
<div v-else-if="this.event.event == 'FundsBurned'" align='center'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#ffaaaa;display:inline-block'><ether-output :wei='event.args.amount'></ether-output> burned.</div></div>
<div v-else-if="this.event.event == 'FundsReleased'" align='center'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#ccffcc;display:inline-block'><ether-output :wei='event.args.amount'></ether-output> released.</div></div>
<div v-else-if="this.event.event == 'Closed'" align='center'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#dddddd;display:inline-block'>Payment closed.</div></div>
<div v-else-if="this.event.event == 'Unclosed'" align='center'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#dddddd;display:inline-block'>Payment re-opened.</div></div>
<div v-else-if="this.event.event == 'AutoreleaseDelayed'" align='center'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#ffdd99;display:inline-block'>Payer reset the autorelease timer.</div></div>
<div v-else-if="this.event.event == 'AutoreleaseTriggered'" align='center'><blocknum-output :blocknum='event.blockNumber' :timestamp='event.timestamp'></blocknum-output><br><div class='well well-sm' align='left' style='background-color:#ffdd99;display:inline-block'>Worker triggered the autorelease.</div></div>`
});

Vue.component('autorelease-output', {
  props: ['state', 'autoreleaseInterval', 'autoreleaseTime'],
  data: function() {
    return {
      now: Math.floor(Date.now()/1000),
      intervalHandle: null,
      displayState: null
    }
  },
  methods: {
    tick: function() {
      this.now = Math.floor(Date.now()/1000);
      
      //determine display state
      if (this.state == 0 || this.state == 3 || this.state == 1) {
        this.displayState = 'interval';
      }
      else if (this.state == 2 && this.autoreleaseTime > this.now) {
        this.displayState = 'countdown';
      }
      else if (this.state == 2 && this.autoreleaseTime <= this.now) {
        this.displayState = 'countdownDone';
      }
    }
  },
  computed: {
    labelText: function() {
      if (this.displayState == 'interval')
        return "Autorelease Interval:";
      else if (this.displayState == 'countdown')
        return "Autorelease in";
      else if (this.displayState == 'countdownDone')
        return "Autorelease available!";
    },
    timeText: function() {
      if (this.displayState == 'interval')
        return humanizeDuration(this.autoreleaseInterval*1000, {largest:2});
      else if (this.displayState == 'countdown')
        return humanizeDuration((this.autoreleaseTime - this.now)*1000, {largest:2});
    }
  },
  mounted: function() {
    this.tick();
    this.intervalHandle = setInterval(this.tick, 1000);
  },
  template: "<div class='well well-sm' style='margin-bottom:0;display:inline-block;background-color:#ffdd99'>{{labelText}}<br>{{timeText}}</div>"
});