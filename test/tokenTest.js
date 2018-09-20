const Token = artifacts.require("KGEtoken");	// Token.sol
const TokenSale = artifacts.require("KGEsale");	// TokenSale.sol

/**
 *	토큰과 토큰 판매 기능을 테스트하는 스크립트
 *	
 *	교환비 수정, 계좌 변경, 토큰 발행 기능을 테스트한다.
 *	토큰 발행 기능은 ETH와 KRW로 구입하는 경우이다.
 *	KRW로 구입하는 경우는 Owner에 의해 추가발행한다.
 */
contract('Token', function(accounts) {
	var admin	 	= web3.eth.accounts[0];	
	var new_admin	= web3.eth.accounts[1];
	var user_ETH	= web3.eth.accounts[2];
	var user_KRW	= web3.eth.accounts[3];

	// check Balance at start point
	//admin_starting_balance = web3.eth.getBalance(admin);


	// Contract 객체 준비
	var KGEtoken;
	var KGEsale;

	Token.deployed().then(function(tokenInstance){
		KGEtoken = tokenInstance;
	}).then(function(){
		TokenSale.deployed().then(function(saleInstance){
			KGEsale = saleInstance;
			KGEtoken.transferOwnership(KGEsale.address, {from:admin});
		});
	});

	/**
	 * ETH to 토큰 교환비 수정 테스트
	 * 변경 전/후 토큰 교환비를 출력한다.
	 */
	it("Exchange rate Change", function(){
		KGEsale
			.setRate(300000, {from:admin})
			.then(function(result){
				// result is an object with the following values:
				//
				// result.tx      => transaction hash, string
				// result.logs    => array of decoded events that were triggered within this transaction
				// result.receipt => transaction receipt object, which includes gas used

				// We can loop through result.logs to see if we triggered the Transfer event.
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
//					console.log(log);

					if (log.event == "ExchangeRateChanged") {
						// We found the event!
						console.log("==========================");
						console.log(log.event);

						var start_Rate = log.args.previousRate;
						var setted_Rate = log.args.newRate;
						console.log(start_Rate+" to "+setted_Rate);
						break;
					}
				}
			})
			.catch(function(error){ console.log(error) });
	});

	/**
	 * 이더 수령 계좌 변경 테스트 
	 * 컨트랙트 소유권도 변경한다.
	 * 변경 전/후 소유권 주소를 출력한다.
	 */
	it("Ownership Change", function(){
		KGEsale
			.transferOwnership(new_admin, {from:admin})
			.then(function(result){
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
//					console.log(log);

					if (log.event == "OwnershipTransferred") {
						// We found the event!
						console.log("==========================");
						console.log(log.event);

						console.log(log.args);
						break;
					}
				}
			})
			.catch(function(error){ console.log(error) });
	});

	/**
	 *	ETH로 토큰 구입 테스트
	 *	위에서 토큰 교환비를 300,000으로 수정했다.
	 *	1ETH를 전송하고 300,000 토큰이 발행되는 것을 확인한다.
	 */
	it("Buy token by ETH", function(){
		KGEsale
			.sendTransaction({from:user_ETH, value:web3.toWei(1, "ether")})
			.then(function(result){
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
//					console.log(log);

					if (log.event == "TokenPurchase") {
						// We found the event!
						console.log("==========================");
						console.log(log.event+" by ETH");

						console.log(log.args);
						return KGEtoken.balanceOf.call(user_ETH,{from:user_ETH});
					}
				}
			})
			.then(function(balance){
				console.log("user_ETH's token balance");
				console.log(web3.fromWei(balance)+"KGE");
			})
			.catch(function(error){ console.log(error)});
	});

	/**
	 *	KRW로 토큰 구입 테스트
	 *	Contract 관리자에게 KRW가 입금되면 관리자는 토큰을 발행한다.
	 */
	it("Buy Token by KRW", function(){
		var tokenAmount = 1000000; // 1 백만
		KGEsale
			.mintTokens(user_KRW, tokenAmount, {from:new_admin})
			.then(function(result){
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];

					if (log.event == "TokenPurchase") {
						// We found the event!
						console.log("==========================");
						console.log(log.event +" by KRW");

						console.log(log.args);

						return KGEtoken.balanceOf.call(user_KRW,{from:user_KRW});
					}
				}
			})
			.then(function(balance){
				console.log("user_KRW's token balance");
				console.log(web3.fromWei(balance)+"KGE");
			})
			.catch(function(error){ console.log(error)});
	});
});
