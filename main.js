let wallet = {
	"lt" : "",
	"hash" : ""
};

let getTonPrice = coins => coins * 10 ** (-9);

async function getAddressInfo(address) {
	let url = `https://toncenter.com/api/v2/getExtendedAddressInformation?address=${address}`;

	let answerOne = await fetch(url);
	let resp = await answerOne.json();
	let ton = getTonPrice(resp.result.balance);

	wallet['lt'] = resp.result.last_transaction_id['lt'];
	wallet['hash'] = resp.result.last_transaction_id['hash'];

	let encdURI = encodeURIComponent(wallet['hash']).replace(/['()]/g, escape).replace(/\*/g, '%2A').replace(/%(?:7C|60|5E)/g, unescape);
	wallet['hash'] = encdURI;

	document.getElementById("wallet-address").innerHTML = resp.result.address.account_address;
	document.getElementById("wallet-balance").innerHTML = `${ton} 💎`;
}

async function getAddressState(address) {
	let url = `https://toncenter.com/api/v2/getAddressState?address=${address}`;

	let answerOne = await fetch(url);
	let resp = await answerOne.json();

	document.getElementById("wallet-status").innerHTML = resp.result;
}

async function getTransactions(address) {
	let url = `https://toncenter.com/api/v2/getTransactions?address=${address}&limit=10&lt=${wallet['lt']}&hash=${wallet['hash']}&to_lt=0&archival=false`;
	//let ur2 = `https://api.ton.cat/v2/explorer/getTransactions?address=${address}&lt=${wallet['lt']}&limit=10&hash=${wallet['hash']}`;

	let answerOne = await fetch(url);
	let resp = await answerOne.json();
	let base = resp.result;

	console.log(base);

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
	await createTableTitle(['Time', 'Coin', 'From/To', 'Address']);

	function createTransactionsList(data) {
		let tr = document.createElement('tr');

		data.forEach((item, index) => {
			let td = document.createElement('td');
			
			if (index == 1) {
				if (data[2] == "From") {
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

			await createTransactionsList([time, coin, "From", adrs]);
		} else {
			let coin = getTonPrice(base[i]['out_msgs'][0]['value']);
			let time = new Date(parseInt(base[i]['utime'] + "000")).toLocaleString();
			let adrs = base[i]['out_msgs'][0]['destination'];

			await createTransactionsList([time, coin, "To", adrs]);
		}
	}
}


document.getElementById("main-search-input").addEventListener("focus", (e) => {
	document.getElementById("main-search-input").addEventListener("keydown", (e) => start(e));
});
document.getElementById("main-search-input").addEventListener("focus", (e) => {
	document.getElementById("main-search-input").removeEventListener("keydown", (e) => start(e));
});

async function start(e) {
	if (e.keyCode == 13) {
		let inpText = document.getElementById("main-search-input").value;

		if (inpText.charAt(inpText.length - 1) == " ") {
			inpText = inpText.slice(0, -1);
			document.getElementById("main-search-input").value = inpText;
		}
		//if (inpText == "") return createContent();

		await getAddressInfo(inpText);
		await getAddressState(inpText);
		await getTransactions(inpText);
	}
}
