const Token = artifacts.require("KGEtoken");
const Ticket = artifacts.require("KGEticket");

/**
 *	티켓 컨트랙트를 테스트하는 스크립트
 *	
 *	컨트랙트 배포 및 티켓 발행 테스트
 *	티켓 P2P 거래 기능 테스트
 *	
 *
 *	TODO
 *	티켓 판매 기능
 *	티켓 거래소 
 */

contract("Ticket", function(accounts){
	var ticketCount = 10;
	var manager = web3.eth.accounts[0];
	var visitor_1 = web3.eth.accounts[1];
	var visitor_2 = web3.eth.accounts[2];

	var ticketId = 1001;
	var ticketPrice = 100000;	// 10 만원

	var KGEticket;
	var KGEtoken;
	
	/**
	 *	Ticket Contract 배포
	 */
	it("contract deploy and mint ticket", function(){
		Ticket.deployed().then(function(inst){
			KGEticket = inst;
			return KGEticket.name();
		}).then(function(result){
			console.log("Name is "+result);
			return KGEticket.symbol();
		}).then(function(result){
			console.log("Symbol is "+result);
			console.log("Deploy Successful!");
			return KGEticket.mintTicket(visitor_1, ticketId, ticketPrice,{from:manager});

		}).then(async(result)=>{
			console.log("Mint ticket Successful!");

			// ticketId 발행 확인
			var isExists = await KGEticket.exists.call(ticketId, {from:visitor_1});
			assert.equal(isExists, true);

			// ticketId 소유자 확인
			var whoIsOwnerOf = await KGEticket.ownerOf.call(ticketId);
			assert.equal(whoIsOwnerOf, visitor_1);

		}).catch(function(error){
			console.log(error);
		});

	});

//	it("Ticket transfer with no pay", function(){
//		Ticket.deployed().then(function(inst){
//			return inst.transferTicket(visitor_2, ticketId, {from:visitor_1});
//		}).then(function(result){
//			console.log(result);
//			assert.equal(result, false);
//		});
//	});
//	it("Ticket transfer with overpricing", function(){
//	});
	it("deploy Token constract", async()=>{
		Token.deployed().then(function(inst){
			KGEtoken = inst;
		});
	});

	//
	it("Mint Token to visitor_2", async()=>{
		var mintAmountToken = 1000000; // 1 백만원

		// Token 발행 to visitor 2
		await KGEtoken.mint(visitor_2, web3.toWei(mintAmountToken, "ether"), {from:manager});

		var balanceOfVisitor_2 = 
			web3.fromWei(await KGEtoken.balanceOf(visitor_2), "ether");
		assert.equal(balanceOfVisitor_2, mintAmountToken);
	});

	//
	it("approve token transfer from visitor_2 to visitor_1", async()=>{
		await KGEtoken.approve(visitor_1, web3.toWei(ticketPrice,"ether"), {from: visitor_2});

		var allowanceOfVisitor_2 = 
			web3.fromWei(await KGEtoken.allowance(visitor_2, visitor_1));
		assert.equal(allowanceOfVisitor_2, ticketPrice);
	});

	//
	it("transfer ticket to visitor_2", async()=>{
		var ownerOfTicket = await KGEticket.ownerOf.call(ticketId);
		assert.equal(ownerOfTicket, visitor_1);

		await KGEticket.transferTicket(visitor_2, ticketId, {from:visitor_1});

		var newOwnerOfTicket = await KGEticket.ownerOf.call(ticketId);
		assert.equal(newOwnerOfTicket, visitor_2);
	});

	/**
	 *	contract deploy and mint를 async와 await을 사용한 버전이다.
	 *	약 300ms 정도 소요된다.
	 */
//	it("contract deploy and mint with async/await", async()=>{
//		KGEcoin = await Token.new();
//		KGEticket = await Ticket.new(KGEcoin.address);
//		
//		await KGEticket.mintTicket(visitor_1, 1001, "Ticket Test",{from:manager});
//
//		let exists = await KGEticket.exists.call(1001);
//		assert.equal(exists, true, "result is "+exists);
//	});
});

