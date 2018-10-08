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

contract("Ticket", async(accounts)=>{
	var ticketCount = 10;
	var manager = web3.eth.accounts[0];
	var visitor_1 = web3.eth.accounts[1];
	var visitor_2 = web3.eth.accounts[2];

	var ticketId = 1001;
	var ticketPrice = 100000;	// 10 만원

	var KGEticket;
	var KGEtoken;

	/**
	 * Contract Deploy
	 */
	it("Deploy contract", async()=>{
		KGEticket = await Ticket.deployed();
		KGEtoken = await Token.deployed();

//		var tokenInTicket = await KGEticket.token();
//		assert.equal(KGEtoken.address, tokenInTicket.address);
	});
	
	/**
	 *	Ticket 발행
	 */
	it("mint ticket", async()=>{
		var ticketPriceWei = web3.toWei(ticketPrice, "ether");	
		await KGEticket.mintTicket(visitor_1, ticketId, ticketPriceWei, {from:manager});

		assert.equal(true, await KGEticket.exists(ticketId));
		assert.equal(visitor_1, await KGEticket.ownerOf(ticketId))
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

	//
	it("Mint Token to visitor_2", async()=>{
		var mintAmountToken = 1000000; // 1 백만원
		var mintAmountTokenWei = web3.toWei(mintAmountToken, "ether");

		// Token 발행 to visitor 2
		await KGEtoken.mint(visitor_2, mintAmountTokenWei, {from:manager});

		var balanceOfVisitor_2 = 
			web3.fromWei(await KGEtoken.balanceOf(visitor_2), "ether");

		assert.equal(balanceOfVisitor_2, mintAmountToken);
	});


	/**
	 *	티켓 전송 테스트
	 *	Ticket : visitor_1 ===> visitor_2
	 *	Token  : visitor_1 <=== visitor_2
	 *
	 *	1. visitor_2가 토큰 전송을 승인한다.
	 *	2. visitor_1이 티켓을 전송하고 토큰을 받는다.
	 *	3. 티켓의 소유자와 토큰 잔고를 확인한다.
	 */
	it("Token Transfer", async()=>{
		var beforeBalance = await KGEtoken.balanceOf(visitor_1);
		var beforeOwner	= await KGEticket.ownerOf(ticketId);

		// 1. token approve for transfer
		var ticketPriceWei = web3.toWei(ticketPrice, "ether");
		await KGEtoken.approve(KGEticket.address, ticketPriceWei, {from: visitor_2});
//		var allowedOfVisitor_2 = 
//			web3.fromWei(await KGEtoken.allowance(visitor_2, visitor_1));
		var allowedOfVisitor_2 = 
			web3.fromWei(await KGEticket.allowanceToken(visitor_2, KGEticket.address));
		assert.isTrue(ticketPrice <= allowedOfVisitor_2);

		// 2. ticket transfer
		await KGEticket.transferTicket(visitor_2, ticketId, {from:visitor_1});

		// 3. Ticket Owner and balance check
		var afterBalance = await KGEtoken.balanceOf(visitor_1);
		var afterOwner	= await KGEticket.ownerOf(ticketId);
		assert.equal(ticketPriceWei, afterBalance - beforeBalance);
		assert.isTrue(beforeOwner != afterOwner);

	});

});

