let wallet = {
	"lt" : "",
	"hash" : ""
};

async function getAddressInfo(address) {
	let url = `https://toncenter.com/api/v2/getExtendedAddressInformation?address=${address}`;

	let answerOne = await fetch(url);
	let resp = await answerOne.json();
	let ton = resp.result.balance * 10 ** (-9);

	wallet['lt'] = resp.result.last_transaction_id['lt'];
	wallet['hash'] = resp.result.last_transaction_id['hash'];

	let encdURI = encodeURIComponent(wallet['hash']).replace(/['()]/g, escape).replace(/\*/g, '%2A').replace(/%(?:7C|60|5E)/g, unescape);
	wallet['hash'] = encdURI;

	console.log(wallet);

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
	let url = `https://toncenter.com/api/v2/getTransactions?address=${address}&limit=10&lt=${wallet['lt']}&hash=${wallet['hash']}%3D&to_lt=0&archival=false`
	let url2 = `https://toncenter.com/api/v2/getTransactions?address=${address}&limit=10&lt=${wallet['lt']}&hash=${wallet['hash']}&to_lt=0&archival=false`;


	let answerOne = await fetch(url2);
	let resp = await answerOne.json();

	console.log(resp);
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
