let address = "EQAl_4uuCkI-rXUvdgbrk8jUmBrWrtZsGvmR3XxuSLC_cnRn";

//let url2 = `https://toncenter.com/api/v2/getWalletInformation?address=${address}`;

let url = `https://toncenter.com/api/v2/getExtendedAddressInformation?address=${address}`

async function send() {
	let answerOne = await fetch(url);
	let resp = await answerOne.json();

	let blc = resp.result.balance;

	console.log(`Balance: ${blc}`)

	let ton = blc * 10 ** (-9);

	console.log(`Result: ${ton}`)
}

send();

