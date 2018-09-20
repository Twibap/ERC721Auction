pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/TokenVesting.sol";

/*
** Smart contract를 통해 authenticket을 거래하기 위한 통화이다.
**
** 서비스 제공자에 의해 발행량이 통제된다.
**
** 발행, 거래 정지, 이자 분배 기능을 지원한다.
*/

contract KGEtoken is MintableToken, PausableToken{
  string public name = "King, God, Emperor Token";
  string public symbol = "KGE";
  uint8 public decimals = 18;

}
