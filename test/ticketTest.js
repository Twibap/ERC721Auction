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

	var KGEticket;
	var KGEtoken;
	
	/**
	 *	Ticket Contract 배포
	 */
	it("contract deploy", async() => {
		Token.deployed().then(function(tokenInstance){
			KGEtoken = tokenInstance;
			Ticket.deployed().then(function(ticketInstance){
				KGEticket = ticketInstance;
			});	
		});
//		KGEtoken = await Token.new();
//		KGEticket = await Ticket.new(KGEtoken.address);
	});
//		Token.deployed().then(function(tokenInstance){
//			KGEtoken = tokenInstance;
//			Ticket.deployed().then(function(ticketInstance){
//				KGEticket = ticketInstance;
//			});	
//		}).then(function(){
//			KGEticket.mintTicket(visitor_1, 1001, "",{from:manager});
//		});

//		Ticket.deployed().then(function(ticketInstance){
//			KGEticket = ticketInstance;
//		}).then(function(){
//			KGEticket.mintTicket();
//		});

	/**
	 * visitor_1 에게 티켓 발행
	 */
	it("mint Tickets", async() => {
		KGEticket.mintTicket(visitor_1, 1001, "Ticket Test");

		let exists = await KGEticket.exists.call(1001);
		assert.equal(exists, true);
	});
});

