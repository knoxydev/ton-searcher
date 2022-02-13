let wallet = {
	"lt" : "",
	"hash" : ""
};

let getTonPrice = coins => coins * 10 ** (-9);

async function getTonUsdPrice(coins) {
	let url = "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false";

	let request = await fetch(url);
	let resp = await request.json();
	let price = resp["the-open-network"]["usd"] * coins;

	return price;
}

async function getAddressInfo(address) {
	let resp;
	try {
		let request = await fetch(`https://toncenter.com/api/v2/getExtendedAddressInformation?address=${address}`);
		resp = await request.json();
	} catch {return getAddressInfo(address);}

	let ton = (resp.result.balance == "-1") ? 0 : getTonPrice(resp.result.balance);

	let numberWithSpaces = x => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
	let coins = numberWithSpaces(Number(String(ton).split('.')[0]));
	let str = String(ton).split('').reverse().join('');

	let tonCoins = x => {
		for (i = 0; i < str.length; i++) {
			if (str[i] == ".") break;
			x.push(str[i])
		}
		return x;
	}

	//console.log(await getTonUsdPrice(Number(String(ton).split('.')[0])));

	ton = `${coins},${tonCoins([]).reverse().join('')}`;

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

	console.log(base);

	if (base.length == 0) {
		document.getElementById("no-transactions-block").style.display = "block";
		document.getElementById("main-transactions-block").style.display = "none";
		return;
	} else document.getElementById("no-transactions-block").style.display = "none";

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

function start(e) {
	if (e.keyCode == 13) {
		let inpText = document.getElementById("main-search-input").value.trim();
		if (inpText == "") return;

		document.getElementById("main-wallet-block").style.display = "block";
		document.getElementById("main-transactions-block").style.display = "block";

		getAddressInfo(inpText);
	}
}
