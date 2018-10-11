const ticketContract = artifacts.require("KGEticket");

/**
 * 	지정된 사용자에게 티켓을 양도하는 것을 방지하는 기능을 테스트한다.
 * 	approve, transferFrom의 로직을 삭제했으며, web3 라이브러리에서 해당 함수를 호출해도
 * 	소유권이 이전되어서는 안된다.
 */
contract("Bad transfer test", async()=>{

	var ticket;

	var contractOwner = web3.eth.accounts[0];
	var ticketOwner = web3.eth.accounts[1];
	var ticketBuyer = web3.eth.accounts[2];

	var ticketId = 1001;
	var ticketPrice = 100000;	// 10 만원

	it("Deploy", async()=>{
		ticket = await ticketContract.deployed();
	});

	it("Mint ticket", async()=>{
		var ticketPriceWei = web3.toWei(ticketPrice, "ether");	
		await ticket.mintTicket(ticketOwner, ticketId, ticketPriceWei, {from:contractOwner});

		assert.equal(true, await ticket.exists(ticketId));
		assert.equal(ticketOwner, await ticket.ownerOf(ticketId))
	});

	it("Approve and transferFrom", async()=>{
		await ticket.approve(ticketBuyer, ticketId, {from:ticketOwner});
		await ticket.transferFrom(ticketOwner, ticketBuyer, ticketId, {from:ticketOwner});

		assert.equal(ticketOwner, await ticket.ownerOf(ticketId))
	});
});
