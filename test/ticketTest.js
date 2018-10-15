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

	var manager = web3.eth.accounts[0];
	var ticketArtist = web3.eth.accounts[1];
	var ticketOwner = web3.eth.accounts[2];
	var ticketBuyer = web3.eth.accounts[3];

	var ticketId = 1001;
	var ticketId_Overpriced = 1002;
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
	 *	Ticket에 artist 주소가 기록된다.
	 */
	it("mint ticket", async()=>{
		var ticketPriceWei = web3.toWei(ticketPrice, "ether");	
		await KGEticket.mintTicket(ticketArtist, ticketId, ticketPriceWei, {from:manager});
		await KGEticket.mintTicket(ticketArtist, ticketId_Overpriced, ticketPriceWei, {from:manager});

		assert.equal(true, await KGEticket.exists(ticketId));
		assert.equal(ticketArtist, await KGEticket.ownerOf(ticketId));

		assert.equal(true, await KGEticket.exists(ticketId_Overpriced));
		assert.equal(ticketArtist, await KGEticket.ownerOf(ticketId_Overpriced));
	});

	// 티켓 구매에 필요한 토큰 발행
	it("Mint Token to ticketBuyer", async()=>{
//		var mintAmountToken = 1000000; // 1 백만원
//		var mintAmountTokenWei = web3.toWei(mintAmountToken, "ether");
//
//		// Token 발행 
//		await KGEtoken.mint(ticketOwner, mintAmountTokenWei, {from:manager});
//		await KGEtoken.mint(ticketBuyer, mintAmountTokenWei, {from:manager});
		await KGEtoken.mint(ticketOwner, web3.toWei(200000, "ether"), {from:manager});
		await KGEtoken.mint(ticketBuyer, web3.toWei(1000000, "ether"), {from:manager});

		var balanceOfOwner = 
			web3.fromWei(await KGEtoken.balanceOf(ticketOwner), "ether");
		var balanceOfBuyer = 
			web3.fromWei(await KGEtoken.balanceOf(ticketBuyer), "ether");

//		assert.equal(balanceOfOwner, mintAmountToken);
//		assert.equal(balanceOfBuyer, mintAmountToken);
		assert.equal(balanceOfOwner, 200000);
		assert.equal(balanceOfBuyer, 1000000);
	});

	
	// 티켓 1차 판매
	it("Ticket open", async()=>{
		var beforeBalance = await KGEtoken.balanceOf(ticketOwner);

		await KGEtoken.approve(KGEticket.address, web3.toWei(ticketPrice, "ether"), {from:ticketOwner});
		await KGEticket.transferTicket(ticketOwner, ticketId, {from:ticketArtist});

		await KGEtoken.approve(KGEticket.address, web3.toWei(ticketPrice, "ether"), {from:ticketOwner});
		await KGEticket.transferTicket(ticketOwner, ticketId_Overpriced, {from:ticketArtist});

		var afterBalance = await KGEtoken.balanceOf(ticketOwner);
		
		assert.equal(ticketOwner, await KGEticket.ownerOf(ticketId));
		assert.equal(ticketOwner, await KGEticket.ownerOf(ticketId_Overpriced));

		assert.equal(ticketPrice * 2, web3.fromWei(beforeBalance-afterBalance, "ether"));
	});
	
	// 임의로 transfer 기능 호출하는 경우
	it("Bad transfer test", async()=>{
		await KGEticket.approve(ticketBuyer, ticketId, {from:ticketOwner});
		await KGEticket.transferFrom(ticketOwner, ticketBuyer, ticketId, {from:ticketOwner});

		// 티켓 소유자가 바뀌지 않아야 한다.
		assert.equal(ticketOwner, await KGEticket.ownerOf(ticketId))
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
	it("Ticket transfer", async()=>{
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
		assert.isTrue(beforeOwner != afterOwner);
		//assert.equal(ticketPriceWei, afterBalance - beforeBalance);
		assert.equal(ticketPrice, web3.fromWei(afterBalance - beforeBalance, "ether"));

	});

	it("Ticket transfer with overprice", async()=>{
		var beforeArtistBalance = await KGEtoken.balanceOf(ticketArtist);
		var beforeOwnerBalance = await KGEtoken.balanceOf(ticketOwner);
		var beforeOwner	= await KGEticket.ownerOf(ticketId_Overpriced);

		// 1. token approve for transfer
		var ticketOverPrice = ticketPrice * 3;
		var ticketOverPriceWei = web3.toWei(ticketOverPrice, "ether");
		await KGEtoken.approve(KGEticket.address, ticketOverPriceWei, {from: ticketBuyer});
//		var allowedOfVisitor_2 = 
//			web3.fromWei(await KGEtoken.allowance(ticketBuyer, ticketOwner));
		var allowedOfVisitor_2 = 
			web3.fromWei(await KGEticket.allowanceToken(ticketBuyer, KGEticket.address));
		assert.isTrue(ticketOverPrice <= allowedOfVisitor_2);

		// 2. ticket transfer
		await KGEticket.transferTicket(ticketBuyer, ticketId_Overpriced, {from:ticketOwner});

		// 3. Ticket Owner and balance check
		var afterArtistBalance = await KGEtoken.balanceOf(ticketArtist);
		var afterOwnerBalance = await KGEtoken.balanceOf(ticketOwner);
		var afterOwner	= await KGEticket.ownerOf(ticketId);

		var incrementArtist = afterArtistBalance - beforeArtistBalance;
		var incrementOwner = afterOwnerBalance - beforeOwnerBalance;
		var totalIncrement = incrementArtist + incrementOwner;

		console.log("beforeArtistBalance : "+web3.fromWei(beforeArtistBalance), "ether");
		console.log("afterArtistBalance : "+web3.fromWei(afterArtistBalance),"ether");
		console.log("incrementArtist: "+web3.fromWei(incrementArtist),"ether");
		console.log("beforeOwnerBalance : "+web3.fromWei(beforeOwnerBalance), "ether");
		console.log("afterOwnerBalance : "+web3.fromWei(afterOwnerBalance),"ether");
		console.log("incrementOwner: "+web3.fromWei(incrementOwner),"ether");
		console.log("add each increment: "+web3.fromWei(incrementArtist+incrementOwner),"ether");
		console.log("total increment: "+web3.fromWei(totalIncrement),"ether");
		/**
		 * beforeArtistBalance : 200000 ether
		 * afterArtistBalance : 400000 ether
		 * incrementArtist: 200000 ether
		 * beforeOwnerBalance : 100000 ether
		 * afterOwnerBalance : 200000 ether
		 * incrementOwner: 100000 ether
		 * add each increment: 299999.99999999997 ether	?????????????????????
		 * total increment: 299999.99999999997 ether	?????????????????????
		 */

		assert.isTrue(beforeOwner != afterOwner);
		//assert.equal(ticketOverPrice, web3.fromWei(incrementArtist + incrementOwner), "ether");

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
});

