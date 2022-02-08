let address = "EQAl_4uuCkI-rXUvdgbrk8jUmBrWrtZsGvmR3XxuSLC_cnRn";

let url = `https://toncenter.com/api/v2/getWalletInformation?address=${address}`;

let url2 = `https://toncenter.com/api/v2/getExtendedAddressInformation?address=${address}`

async function send() {
	let answerOne = await fetch(url2);
	let resp1 = await answerOne.json();

	console.log(resp1);
}

send();

