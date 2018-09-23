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

	// 티켓 발행 가격
	mapping (uint256 => uint256) internal ticketValue;

	// 공연 기획자 주소 == 2차 거래 시 발행 가격 초과금액 환수할 주소
	mapping (uint256 => address) internal ticketGuarantor;

	// 티켓 사용 여부 기록 -> RSA 활용???
	mapping(uint256 => bool) internal guaranteedTokensCheckIn;

	/**
	**	티켓 가격 확인 
	*/
   	function getTicketValue(uint256 _ticketId) public view returns(uint256){
		require(exists(_ticketId) === true);
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
}

