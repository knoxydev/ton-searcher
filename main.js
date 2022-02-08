async function getAddressInfo(address) {
	let url = `https://toncenter.com/api/v2/getExtendedAddressInformation?address=${address}`;

	let answerOne = await fetch(url);
	let resp = await answerOne.json();
	let ton = resp.result.balance * 10 ** (-9);

	console.log(resp)

	document.getElementById("wallet-address").innerHTML = resp.result.address.account_address;
	document.getElementById("wallet-balance").innerHTML = `${ton} 💎`;
}

async function getAddress(address) {
	let url = `https://toncenter.com/api/v2/getAddressState?address=${address}`;

	let answerOne = await fetch(url);
	let resp = await answerOne.json();

	document.getElementById("wallet-status").innerHTML = resp.result;
}

async function getTransactions(address) {
	let url = `https://toncenter.com/api/v2/getTransactions?address=${address}&limit=10&lt=24923013000003&hash=mcbrbKEU7oxVcRiWU9NL895or8S%2FiMbsIcfMX72weOo%3D&to_lt=0&archival=false`
	
	let answerOne = await fetch(url);
	let resp = await answerOne.json();

	console.log(resp);
}


document.getElementById("main-search-input").addEventListener("focus", (e) => {
	document.getElementById("main-search-input").addEventListener("keydown", (e) => start(e));
});
document.getElementById("main-search-input").addEventListener("focus", (e) => {
	document.getElementById("main-search-input").removeEventListener("keydown", (e) => start(e));
});

let start = (e) => {
	if (e.keyCode == 13) {
		let inpText = document.getElementById("main-search-input").value;

		if (inpText.charAt(inpText.length - 1) == " ") {
			inpText = inpText.slice(0, -1);
			document.getElementById("main-search-input").value = inpText;
		}
		//if (inpText == "") return createContent();

		getAddressInfo(inpText);
		getAddress(inpText);
		getTransactions(inpText);
	}
}
