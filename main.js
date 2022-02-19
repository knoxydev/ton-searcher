let wallet = {
	"lt" : "",
	"hash" : "",
	"wallet-address": ""
};

let getTonPrice = coins => coins * 10 ** (-9);

let changeURL = address => history.pushState(null, null, `/?s=${address}`);

let numberWithSpaces = coins => {
	// the function adds spaces to large numbers
	let Spaces = x => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
	let integerSpaces = Spaces(Number(String(coins).split('.')[0]));

	let str = String(coins).split('').reverse().join('');

	let remainderNumber = x => {
		for (i = 0; i < str.length; i++) {
			if (str[i] == ".") break;
			x.push(str[i])
		}
		return x;
	}
	return coins = `${integerSpaces},${remainderNumber([]).reverse().join('')}`;
};

let tonPriceUSD = async coins => {
	let resp;
	try {
		let request = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=USD");
		resp = await request.json();
	} catch {return tonPriceUSD(coins);}

	let money = numberWithSpaces(coins * resp['the-open-network']['usd']);
	document.getElementById("wallet-balance-usd").innerHTML = `$${money}`;
};

async function getAddressInfo(address) {
	let resp;
	try {
		let request = await fetch(`https://toncenter.com/api/v2/getExtendedAddressInformation?address=${address}`);
		resp = await request.json();
	} catch {return getAddressInfo(address);}

	let ton = (resp.result.balance == "-1") ? 0 : getTonPrice(resp.result.balance);

	tonPriceUSD(ton);

	let toncoins = numberWithSpaces(ton);
	ton = toncoins;

	wallet['lt'] = resp.result.last_transaction_id['lt'];
	wallet['hash'] = resp.result.last_transaction_id['hash'];

	let encdURI = encodeURIComponent(wallet['hash']).replace(/['()]/g, escape).replace(/\*/g, '%2A').replace(/%(?:7C|60|5E)/g, unescape);
	wallet['hash'] = encdURI;

	document.getElementById("wallet-address").innerHTML = resp.result.address.account_address;
	document.getElementById("wallet-balance").innerHTML = `${ton} 💎`;

	getAddressState(address);
}

async function getAddressState(address) {
	let resp;
	try {
		let request = await fetch(`https://toncenter.com/api/v2/getAddressState?address=${address}`);
		resp = await request.json();
	} catch {return getAddressState(address);} 

	document.getElementById("wallet-state").innerHTML = resp.result;
	getTransactions(address);
}

async function getTransactions(address) {
	let base;
	try {
		let request = await fetch(`https://toncenter.com/api/v2/getTransactions?address=${address}&limit=100&lt=${wallet['lt']}&hash=${wallet['hash']}&to_lt=0&archival=false`);
		let resp = await request.json();
		base = await resp.result;
	} catch {return getTransactions(address);}

	if (base.length == 0) {
		document.getElementById("no-transactions-block").style.display = "block";
		document.getElementById("main-transactions-block").style.display = "none";
		return;
	} else document.getElementById("no-transactions-block").style.display = "none";

	document.getElementById("wallet-number-transactions").innerHTML = base.length;
	let transactionList = document.getElementById("main-transactions-block");
	transactionList.innerHTML = "";

	function createTransactionsList(data) {
		let mainDiv = document.createElement('div');

		data.forEach((item, index) => {
			if (index == 0) {
				let balanceDiv = document.createElement('div');
				if (data[1] == "From") {
					balanceDiv.innerHTML = `+${item} 💎`;
					balanceDiv.style.color = "green";
				}
				else {
					balanceDiv.innerHTML = `-${item} 💎`;
					balanceDiv.style.color = "maroon";
				}
				mainDiv.append(balanceDiv);

			} else if (index == 1) {
				let fromToDiv = document.createElement('div');
				fromToDiv.innerHTML = `<span>${item}</span> - ${data[2]}`;
				mainDiv.append(fromToDiv);

			} else if (index == 3) {
				let fee = document.createElement('div');
				fee.innerHTML = `Fee: ${item}`;
				mainDiv.append(fee);

			} else if (index == 4) {
				let time = document.createElement('div');
				time.innerHTML = item;
				mainDiv.append(time);
			}
		});
		transactionList.append(mainDiv);
	}

	for (i = 0; i < base.length; i++) {
		if (base[i]['out_msgs'].length == 0) {
			let coin = getTonPrice(base[i]['in_msg']['value']);
			let time = new Date(parseInt(base[i]['utime'] + "000")).toLocaleString();
			let adrs = base[i]['in_msg']['source'];
			let tfee = `${getTonPrice(base[i]['fee'])} 💎`;

			createTransactionsList([coin, "From", adrs, tfee, time]);
		} else {
			let coin = getTonPrice(base[i]['out_msgs'][0]['value']);
			let time = new Date(parseInt(base[i]['utime'] + "000")).toLocaleString();
			let adrs = base[i]['out_msgs'][0]['destination'];
			let tfee = `${getTonPrice(base[i]['fee'])} 💎`;

			createTransactionsList([coin, "To", adrs, tfee, time]);
		}
	}
}

document.getElementById("main-search-input").addEventListener("focus", (e) => {
	document.getElementById("main-search-input").addEventListener("keydown", (e) => start(e));
});
document.getElementById("main-search-input").addEventListener("focus", (e) => {
	document.getElementById("main-search-input").removeEventListener("keydown", (e) => start(e));
});

window.onload = () => {
	let main = window.location;

	if (main.search == "") return;
	else {
		let url = main.search.split('').splice(3).join('');

		document.getElementById("main-search-input").value = url;
		return getAddressInfo(url);
	}
};

function start(e) {
	if (e.keyCode == 13) {
		let inpText = document.getElementById("main-search-input").value.trim();
		if (inpText == "") return;

		document.getElementById("main-wallet-block").style.display = "block";
		document.getElementById("main-transactions-block").style.display = "block";

		changeURL(inpText);
		getAddressInfo(inpText);
	}
}
