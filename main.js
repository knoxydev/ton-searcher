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
	
	console.log(resp)

	//if (request.status == 502 || request.status == 504) 

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
	
	//if (request.status == 502 || request.status == 504) 

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

	let table = document.getElementById("main-transactions-table");
	table.innerHTML = "";

	function createTableTitle(titleWords) {
		let tr = document.createElement('tr');

		for (let elem of titleWords) {
			let th = document.createElement('th');
			th.innerHTML = elem;
			tr.append(th);
		}

		table.append(tr);	
	}
	createTableTitle(['Time', 'Fee', 'TON', 'From/To', 'Address']);

	function createTransactionsList(data) {
		let tr = document.createElement('tr');

		data.forEach((item, index) => {
			let td = document.createElement('td');
			
			if (index == 2) {
				if (data[3] == "From") {
					td.innerHTML = `+${item} 💎`;
					td.style.color = "green";
				}
				else {
					td.innerHTML = `-${item} 💎`;
					td.style.color = "maroon";
				}
			} else td.innerHTML = item;

			tr.append(td);
		});

		table.append(tr);	
	}

	for (i = 0; i < base.length; i++) {
		if (base[i]['out_msgs'].length == 0) {
			let coin = getTonPrice(base[i]['in_msg']['value']);
			let time = new Date(parseInt(base[i]['utime'] + "000")).toLocaleString();
			let adrs = base[i]['in_msg']['source'];
			let tfee = `${getTonPrice(base[i]['fee'])} 💎`;

			await createTransactionsList([time, tfee, coin, "From", adrs]);
		} else {
			let coin = getTonPrice(base[i]['out_msgs'][0]['value']);
			let time = new Date(parseInt(base[i]['utime'] + "000")).toLocaleString();
			let adrs = base[i]['out_msgs'][0]['destination'];
			let tfee = `${getTonPrice(base[i]['fee'])} 💎`;

			await createTransactionsList([time, tfee, coin, "To", adrs]);
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

		document.getElementById("main-block").style = "padding-top: 40px";
		document.getElementById("main-wallet-block").style.display = "block";
		document.getElementById("main-transactions-block").style.display = "block";

		getAddressInfo(inpText);
	}
}
