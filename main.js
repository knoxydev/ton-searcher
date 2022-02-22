let wallet = {
	"lt" : "",
	"hash" : "",
	"api_key" : "b0f5c4749308355b4373e494805e5dfa1b84a71cbec822df8cb6f6886aa080ba"
};

let getTonPrice = coins => coins * 10 ** (-9);

let changeURL = address => history.pushState(null, null, `/ton-searcher/?q=${address}`);

let numberWithSpaces = coins => {
	// the function adds spaces to large numbers
	if (coins == 0) return;
	if (String(coins).length == 1) return;

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
	
	//let remainderNumberReverse = remainderNumber([]).reverse();
	//let fractionalPart = '00';
	//if (remainderNumberReverse.length >= 2) fractionalPart = `${remainderNumberReverse[0]}${remainderNumberReverse[1]}`;
	//else if (remainderNumberReverse.length == 1) fractionalPart = `${remainderNumberReverse[0]}0`;

	//return `${integerSpaces},${fractionalPart}`;

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
	document.getElementById("main-wallet-block").style.display = "none";
	let resp;
	try {
		let request = await fetch(`https://toncenter.com/api/v2/getExtendedAddressInformation?address=${address}`);

		if (request.status == 416) {
			document.getElementById("error-block").style.display = "block";
			document.getElementById("main-wallet-block").style.display = "none";
			document.getElementById("main-transactions-block").innerHTML = "";
			document.getElementById("main-transactions-block").style.display = "none";
			return;
		} else {
			document.getElementById("error-block").style.display = "none";
			document.getElementById("main-wallet-block").style.display = "block";
			document.getElementById("main-transactions-block").style.display = "block";
		}

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
	document.getElementById("main-wallet-block").style.display = "block";

	getAddressState(address);
}

async function getAddressState(address) {
	let resp;
	try {
		let request = await fetch(`https://toncenter.com/api/v2/getAddressState?api_key=${wallet['api_key']}&address=${address}`);
		resp = await request.json();
	} catch {return getAddressState(address);} 

	document.getElementById("wallet-state").innerHTML = resp.result;
	getTransactions(address);
}

async function getTransactions(address) {
	let base;
	try {
		let request = await fetch(`https://toncenter.com/api/v2/getTransactions?api_key=${wallet['api_key']}&address=${address}&limit=100&lt=${wallet['lt']}&hash=${wallet['hash']}&to_lt=0&archival=false`);
		let resp = await request.json();
		base = await resp.result;
	} catch {return getTransactions(address);}

	if (base.length == 0) {
		document.getElementById("no-transactions-block").style.display = "block";
		document.getElementById("main-transactions-block").style.display = "none";
		return;
	} else document.getElementById("no-transactions-block").style.display = "none";

	await transactionBlock(base);
}

function transactionBlock(base) {
	let transactionList = document.getElementById("main-transactions-block");
	transactionList.innerHTML = "";
	transactionList.style.display = "none";

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

	transactionList.style.display = "block";
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

		if (url.length > 0) {
			if (url.length < 48 || url.length > 48) {
				document.getElementById("main-wallet-block").style.display = "none";
				document.getElementById("main-transactions-block").style.display = "none";
				document.getElementById("error-block").style.display = "block";
				return;
			}
		}

		document.getElementById("main-search-input").value = url;
		changeURL(String(url));
		return getAddressInfo(String(url));
	}
};

function start(e) {
	if (e.keyCode == 13) {
		let inpText = document.getElementById("main-search-input").value.trim();

		if (inpText == "" || inpText.length < 48 || inpText.length > 48) {
			document.getElementById("main-wallet-block").style.display = "none";
			document.getElementById("main-transactions-block").style.display = "none";
			document.getElementById("error-block").style.display = "block";
			return;
		}

		changeURL(String(inpText));
		getAddressInfo(inpText);
	}
}
