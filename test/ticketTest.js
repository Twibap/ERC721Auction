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
	var ticketOwner = web3.eth.accounts[1];
	var ticketBuyer = web3.eth.accounts[2];

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
		await KGEticket.mintTicket(ticketOwner, ticketId, ticketPriceWei, {from:manager});

		assert.equal(true, await KGEticket.exists(ticketId));
		assert.equal(ticketOwner, await KGEticket.ownerOf(ticketId))
	});

//	it("Ticket transfer with no pay", function(){
//		Ticket.deployed().then(function(inst){
//			return inst.transferTicket(ticketBuyer, ticketId, {from:ticketOwner});
//		}).then(function(result){
//			console.log(result);
//			assert.equal(result, false);
//		});
//	});
//	it("Ticket transfer with overpricing", function(){
//	});
	
	// 임의로 transfer 기능 호출하는 경우
	it("Bad transfer test", async()=>{
		await KGEticket.approve(ticketBuyer, ticketId, {from:ticketOwner});
		await KGEticket.transferFrom(ticketOwner, ticketBuyer, ticketId, {from:ticketOwner});

		// 티켓 소유자가 바뀌지 않아야 한다.
		assert.equal(ticketOwner, await KGEticket.ownerOf(ticketId))
	});

	// 티켓 구매에 필요한 토큰 발행
	it("Mint Token to ticketBuyer", async()=>{
		var mintAmountToken = 1000000; // 1 백만원
		var mintAmountTokenWei = web3.toWei(mintAmountToken, "ether");

		// Token 발행 to visitor 2
		await KGEtoken.mint(ticketBuyer, mintAmountTokenWei, {from:manager});

		var balanceOfVisitor_2 = 
			web3.fromWei(await KGEtoken.balanceOf(ticketBuyer), "ether");

		assert.equal(balanceOfVisitor_2, mintAmountToken);
	});


	/**
	 *	티켓 전송 테스트
	 *	Ticket : ticketOwner ===> ticketBuyer
	 *	Token  : ticketOwner <=== ticketBuyer
	 *
	 *	1. ticketBuyer가 토큰 전송을 승인한다.
	 *	2. ticketOwner이 티켓을 전송하고 토큰을 받는다.
	 *	3. 티켓의 소유자와 토큰 잔고를 확인한다.
	 */
	it("Token Transfer", async()=>{
		var beforeBalance = await KGEtoken.balanceOf(ticketOwner);
		var beforeOwner	= await KGEticket.ownerOf(ticketId);

		// 1. token approve for transfer
		var ticketPriceWei = web3.toWei(ticketPrice, "ether");
		await KGEtoken.approve(KGEticket.address, ticketPriceWei, {from: ticketBuyer});
//		var allowedOfVisitor_2 = 
//			web3.fromWei(await KGEtoken.allowance(ticketBuyer, ticketOwner));
		var allowedOfVisitor_2 = 
			web3.fromWei(await KGEticket.allowanceToken(ticketBuyer, KGEticket.address));
		assert.isTrue(ticketPrice <= allowedOfVisitor_2);

		// 2. ticket transfer
		await KGEticket.transferTicket(ticketBuyer, ticketId, {from:ticketOwner});

		// 3. Ticket Owner and balance check
		var afterBalance = await KGEtoken.balanceOf(ticketOwner);
		var afterOwner	= await KGEticket.ownerOf(ticketId);
		assert.equal(ticketPriceWei, afterBalance - beforeBalance);
		assert.isTrue(beforeOwner != afterOwner);

	});

});

