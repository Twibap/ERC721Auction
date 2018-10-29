pragma solidity ^0.4.24;

import "./Token.sol";
import "./auction/contracts/ExchangeableToERC20.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/AddressUtils.sol";

/**
**	KGEticket은 2차 거래 시 중개인 없이 거래할 수 있는 티켓이다.
**	중개인이 없어도 최초 발행 가격을 초과하여 거래하지 않도록 구현한다.
**	최초 발행 가격을 초과하는 경우 초과된 금액에 대해 티켓을 발행한 Smart Contract로 환수한다.
**
** 	TODO
**	티켓을 사용한 후 더이상 거래할 수 없다.
**	재판매 기능
**	환불 기능
*/
contract KGEticket is ERC721Token, ExchangeableToERC20{

	// KGEbasicTicket
	using SafeMath for uint256;
	using AddressUtils for address;

	string public name = "King, God, Emperor Ticket";
	string public symbol = "KGET";

	// 티켓 발행 가격
	mapping (uint256 => uint256) internal ticketPrice;

	// 공연 기획자 주소 == 2차 거래 시 발행 가격 초과금액 환수할 주소
	mapping (uint256 => address) internal ticketArtist;

	// 공연 시간
	mapping(uint256 => uint256) internal showtime; 

	// 좌석

	// 티켓 사용 여부 기록 -> RSA 활용???
	mapping(uint256 => bool) internal guaranteedTokensCheckIn;



	// 티켓 거래용 전용 토큰
	KGEtoken public token;

	constructor(KGEtoken _token) 
		public ERC721Token(name, symbol) ExchangeableToERC20(_token) {
	}

	function allowanceToken(address _owner, address _spender)
	public view returns(uint256){
		return token.allowance(_owner, _spender);
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
	function exchange(address _to, uint256 _ticketId) public returns(bool){
//		require( msg.sender == ownerOf(_ticketId) );

		uint256 price = token.allowance(_to, this);
		uint256 ticketVal = getTicketValue(_ticketId);

		require(price > 0);	// KGEtoken으로만 거래 가능하다.

		// 거래가격이 티켓 가격을 초과하더라도 티켓 가격만큼만 전송된다.
		if(price > ticketVal){		
			uint256 overPrice = price.sub(ticketVal);
			token.transferFrom(_to, artistOf(_ticketId), overPrice); // 초과금 환수

			price = ticketVal;
		}
		// else is (pice <= ticketVal)

		// 토큰 전송
		// TODO revert 발생
//		require(price <= token.allowance(_to, msg.sender));
		if( token.transferFrom(_to, msg.sender, price) == false ){
			// TODO 초과금 환수 후 balance 부족한 경우 revert 일어나는지 확인 필요
			return false;
		}

//		super.approve(_to, _ticketId);
		super.transferFrom(msg.sender, _to, _ticketId);
		return true;
	}

	/**
	**	티켓 가격 확인 
	*/
   	function getTicketValue(uint256 _ticketId) public view returns(uint256){
		require(exists(_ticketId) == true);
		return ticketPrice[_ticketId];
	}

	/**
	** 티켓 ID로 공연 기획자 주소를 확인한다.
	*/
	function artistOf(uint256 _ticketId) public view returns(address){
		address artist = ticketArtist[_ticketId];
		require(artist != address(0));
		return artist;
	}

	/**	Override by Twibap
	** 티켓 발행 단계에서 Artist를 등록한다.
	** 이후 Artist는 수정되지 않는다.
	** Artist는 TicketSale Contract이다.
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

		// Artist 등록
		ticketArtist[_tokenId] = _to;

		emit Transfer(address(0), _to, _tokenId);
	}

	function mintTicket(address _to, uint256 _ticketId,	uint256 _ticketPrice) public{
		_mint(_to, _ticketId);
		_setTicketPrice(_ticketId, _ticketPrice);
		//super._setTokenURI(_ticketId, _ticketURI);
	}

	function _setTicketPrice(uint256 _ticketId, uint256 _ticketPrice) internal{
		require(exists(_ticketId));
		ticketPrice[_ticketId] = _ticketPrice;
	}

	/**
	** P2P 거래 방지를 위해 다음 기능 호출을 방지한다.
	** approve, transferFrom
	** 해당 함수가 필요한 지점에서는 [super.]를 사용한다.
	*/
	function approve(address _to, uint256 _tokenId) public {
		(_to); (_tokenId);
	}
	function transferFrom(address _from, address _to, uint256 _tokenId) public {
		(_from); (_to); (_tokenId);
	}

}
