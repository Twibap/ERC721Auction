pragma solidity ^0.4.24;

import "./token.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";

/**
** Ether 사용자를 위한 판매 기능과 KRW 사용자를 위한 발행 기능을 합침
*/

contract KGEsale is MintedCrowdsale, Ownable{

	//KGEtoken token;	// revert point at mintTokens

	event ExchangeRateChanged(
		uint256 indexed previousRate,
		uint256 indexed newRate
	);

	constructor(uint256 _rate, address _wallet, MintableToken _tokenAddr) 
	public Crowdsale(_rate, _wallet, _tokenAddr){
	//	token = KGEtoken(_tokenAddr);	// revert point at mintTokens
	}

	// 교환비 수정
	function setRate(uint256 _newRate) public onlyOwner {
		require(_newRate > 0);

		emit ExchangeRateChanged(rate, _newRate);
		rate = _newRate;
	}

	function getRate() public view returns (uint256) {
		return rate;
	}

	// Override from Ownable
	function _transferOwnership(address _newOwner) internal{
		super._transferOwnership(_newOwner);
		wallet = _newOwner;	// 이더 수신 주소 변경
	}

	// 토큰 발행
	function mintTokens(address _beneficiary, uint256 _amount) public onlyOwner {
		_preValidatePurchase(_beneficiary, _amount);

		emit TokenPurchase(
			msg.sender,
			_beneficiary,
			_amount,	// KRW
			_amount		// Token
		);
		_deliverTokens(_beneficiary, _amount);
	}
}
