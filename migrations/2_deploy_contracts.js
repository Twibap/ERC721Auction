// var Ownable = artifacts.require("Ownable");

// NOTE: Use this file to easily deploy the contracts you're writing.
//   (but make sure to reset this file before committing
//    with `git checkout HEAD -- migrations/2_deploy_contracts.js`)

// Wrong
//const KGEcoinsale = artifacts.require("./TokenSale.sol");
//const KGEcoin = artifacts.require("./Token.sol");
const KGEcoinsale = artifacts.require("KGEsale");
const KGEcoin = artifacts.require("KGEtoken");
const KGEticket = artifacts.require("KGEticket");

module.exports = function (deployer, network, accounts) {
	const rate = new web3.BigNumber(230000);	// 23만원
	const wallet = accounts[0];	// Smart Contract 입금된 ether 수취 계좌

	// KGEcoinCrowdsale 발행 시 KGEcoin의 주소가 필요하기 때문에 
	// KGEcoin이 발행된 뒤에 KGEcoinCrowdsale을 발행한다.
	deployer.deploy(KGEcoin).
		then(function(){
			return deployer.deploy(
				KGEcoinsale, rate, wallet, KGEcoin.address);
		}).
		then(function(){
			return deployer.deploy(KGEticket, KGEcoin.address);
		});
	
	// 매개변수 network의 사용 방법
	// truffle.js 에 작성한 네트워크에 따라 배포방법이 다를 경우 사용
	if( network == "development") {
		// ...
	} else {
		// ...
	}
};
