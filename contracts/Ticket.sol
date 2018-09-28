pragma solidity ^0.4.24;

import "./Token.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/AddressUtils.sol";

/**
**	KGEticket은 2차 거래 시 중개인 없이 거래할 수 있는 티켓이다.
**	중개인이 없어도 최초 발행 가격을 초과하여 거래하지 않도록 구현한다.
**	최초 발행 가격을 초과하는 경우 초과된 금액에 대해 티켓을 발행한 Smart Contract로 환수한다.
**
**	티켓을 사용한 후 더이상 거래할 수 없다.
*/
contract KGEticket is ERC721Token{

	// KGEbasicTicket
	using SafeMath for uint256;
	using AddressUtils for address;

	string public name = "King, God, Emperor Ticket";
	string public symbol = "KGET";

	// 티켓 발행 가격
	mapping (uint256 => uint256) internal ticketValue;

	// 공연 기획자 주소 == 2차 거래 시 발행 가격 초과금액 환수할 주소
	mapping (uint256 => address) internal ticketGuarantor;

	// 티켓 사용 여부 기록 -> RSA 활용???
	mapping(uint256 => bool) internal guaranteedTokensCheckIn;

	// 티켓 거래용 전용 토큰
	address tokenAddr;

	constructor(address _token) public{
		tokenAddr = _token;
	//	token = KGEtoken(_token);
	}

	/**
	**	티켓 전송
	**
	**	티켓 구매자가 티켓 소유주에게 KGEtoken 전송을 승인(approve)하면,
	**	티켓 소유주는 티켓을 구매자에게 전달한다.
	**	@param 	_to 		티켓 구매자
	**	@param 	_ticketId 	티켓 고유번호
	**	@dev 	msg.sender	티켓 판매자
	*/
	function transferTicket(address _to, uint256 _ticketId) public returns(bool){
		require( msg.sender == ownerOf(_ticketId) );

		KGEtoken token = KGEtoken(tokenAddr);

		uint256 price = token.allowance(_to, msg.sender);
		uint256 ticketVal = getTicketValue(_ticketId);

		require(price > 0);	// KGEtoken으로만 거래 가능하다.

		if(price >= ticketVal){		
			// 거래가격이 티켓 가격을 초과하더라도 티켓 가격만큼만 전송된다.

			token.transferFrom(_to, msg.sender, ticketVal);
			approve(_to, _ticketId);
			emit Approval(msg.sender, _to, _ticketId);
			transferFrom(msg.sender, _to, _ticketId);

		} else if (price < ticketVal){

			token.transferFrom(_to, msg.sender, price);
			approve(_to, _ticketId);
			emit Approval(msg.sender, _to, _ticketId);
			transferFrom(msg.sender, _to, _ticketId);

		}

		emit Transfer(msg.sender, _to, _ticketId);
		return true;
	}

	/**
	**	티켓 가격 확인 
	*/
   	function getTicketValue(uint256 _ticketId) public view returns(uint256){
		require(exists(_ticketId) == true);
		return ticketValue[_ticketId];
	}

	/**
	** 티켓 ID로 공연 기획자 주소를 확인한다.
	*/
	function guarantorOf(uint256 _ticketId) public view returns(address){
		address guarantor = ticketGuarantor[_ticketId];
		require(guarantor != address(0));
		return guarantor;
	}

	/**	Override by Twibap
	** 티켓 발행 단계에서 Guarantor를 등록한다.
	** 이후 Guarantor는 수정되지 않는다.
	** Guarantor는 TicketSale Contract이다.
	** TicketSale Contract 소유자는 바뀔 수 있다.
	**
	 * @dev Internal function to mint a new token
	 * Reverts if the given token ID already exists
	 * @param _to The address that will own the minted token AND TicketSale Contract
	 * @param _tokenId uint256 ID of the token to be minted by the msg.sender
	 */
	function _mint(address _to, uint256 _tokenId) internal {
		require(_to != address(0));
		addTokenTo(_to, _tokenId);

		// Guarantor 등록
		ticketGuarantor[_tokenId] = _to;

		emit Transfer(address(0), _to, _tokenId);
	}

	function mintTicket(address _to, uint256 _ticketId,	string _ticketURI) public{
		_mint(_to, _ticketId);
		super._setTokenURI(_ticketId, _ticketURI);
	}

}
