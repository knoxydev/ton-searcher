async function sendRequest(address) {
	let url = `https://toncenter.com/api/v2/getExtendedAddressInformation?address=${address}`;

	let answerOne = await fetch(url);
	let resp = await answerOne.json();

	let ton = resp.result.balance * 10 ** (-9);

	console.log(`Result: ${ton}`);
	console.log(resp.result);

	document.getElementById("wallet-address").innerHTML = resp.result.address.account_address;
	document.getElementById("wallet-balance").innerHTML = `${ton} 💎`;
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

		sendRequest(inpText);
	}
}
