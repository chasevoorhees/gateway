import {
  EstimateGasResponse,
  PerpAvailablePairsResponse,
  PerpCreateTakerRequest,
  PerpCreateTakerResponse,
  PerpMarketRequest,
  PerpMarketResponse,
  PerpPositionRequest,
  PerpPositionResponse,
  PerpPricesResponse,
  PriceRequest,
  PriceResponse,
  TradeRequest,
  TradeResponse,
  AddLiquidityRequest,
  AddLiquidityResponse,
  RemoveLiquidityRequest,
  RemoveLiquidityResponse,
  CollectEarnedFeesRequest,
  PositionRequest,
  PositionResponse,
  PoolPriceRequest,
  PoolPriceResponse,
  PerpBalanceRequest,
  PerpBalanceResponse,
  CosmosRemoveLiquidityRequest,
  CosmosAddLiquidityRequest,
  CosmosAddLiquidityResponse,
  CosmosRemoveLiquidityResponse,
  CosmosPoolPriceRequest,
  CosmosPoolPriceResponse,
  CosmosPoolPositionsRequest,
  CosmosPoolPositionsResponse,
  CosmosPriceResponse,
  CosmosTradeResponse,
} from './amm.requests';
import {
  price as uniswapPrice,
  trade as uniswapTrade,
  addLiquidity as uniswapV3AddLiquidity,
  removeLiquidity as uniswapV3RemoveLiquidity,
  collectEarnedFees as uniswapV3CollectEarnedFees,
  positionInfo as uniswapV3PositionInfo,
  poolPrice as uniswapV3PoolPrice,
  estimateGas as uniswapEstimateGas,
} from '../connectors/uniswap/uniswap.controllers';
import {
  price as refPrice,
  trade as refTrade,
  estimateGas as refEstimateGas,
} from '../connectors/ref/ref.controllers';
import {
  price as tinymanPrice,
  trade as tinymanTrade,
  estimateGas as tinymanEstimateGas,
} from '../connectors/tinyman/tinyman.controllers';
import {
  getPriceData as perpPriceData,
  createTakerOrder,
  estimateGas as perpEstimateGas,
  getPosition,
  getAvailablePairs,
  checkMarketStatus,
  getAccountValue,
} from '../connectors/perp/perp.controllers';
import {
  price as plentyPrice,
  trade as plentyTrade,
  estimateGas as plentyEstimateGas,
} from '../connectors/plenty/plenty.controllers';
import { getInitializedChain, getConnector } from '../services/connection-manager';
import {
  Chain as Ethereumish,
  Nearish,
  NetworkSelectionRequest,
  Perpish,
  RefAMMish,
  Tezosish,
  Uniswapish,
  UniswapLPish,
} from '../services/common-interfaces';
import { Algorand } from '../chains/algorand/algorand';
import { Tinyman } from '../connectors/tinyman/tinyman';
import { Plenty } from '../connectors/plenty/plenty';

import { Osmosis } from '../chains/osmosis/osmosis';
import { COLLECTFEES_ENDPOINT_NOT_SUPPORTED_ERROR_CODE, COLLECTFEES_ENDPOINT_NOT_SUPPORTED_ERROR_MESSAGE, HttpException } from '../services/error-handler';

export async function price(req: PriceRequest): Promise<PriceResponse | CosmosPriceResponse> {
  const chain = await getInitializedChain<Algorand | Ethereumish | Nearish | Tezosish | Osmosis>(
    req.chain,
    req.network
  );
  if (chain instanceof Osmosis){
    return chain.controller.price(chain as unknown as Osmosis, req);
  }

  const connector: Uniswapish | RefAMMish | Tinyman | Plenty = await getConnector<
    Uniswapish | RefAMMish | Tinyman | Plenty
  >(req.chain, req.network, req.connector);

  if (connector instanceof Plenty) {
    return plentyPrice(<Tezosish>chain, connector, req);
  } else if ('routerAbi' in connector) {
    // we currently use the presence of routerAbi to distinguish Uniswapish from RefAMMish
    return uniswapPrice(<Ethereumish>chain, connector, req);
  } else if (connector instanceof Tinyman) {
    return tinymanPrice(chain as unknown as Algorand, connector, req);
  }
  else {
    return refPrice(<Nearish>chain, connector as RefAMMish, req);
  }
}

export async function trade(req: TradeRequest): Promise<TradeResponse | CosmosTradeResponse> {
  const chain = await getInitializedChain<Algorand | Ethereumish | Nearish | Tezosish | Osmosis>(
    req.chain,
    req.network
  );
  if (chain instanceof Osmosis){
    return chain.controller.trade(chain as unknown as Osmosis, req);
  }

  const connector: Uniswapish | RefAMMish | Tinyman | Plenty = await getConnector<
    Uniswapish | RefAMMish | Tinyman | Plenty
  >(req.chain, req.network, req.connector);

  if (connector instanceof Plenty) {
    return plentyTrade(<Tezosish>chain, connector, req);
  } else if ('routerAbi' in connector) {
    // we currently use the presence of routerAbi to distinguish Uniswapish from RefAMMish
    return uniswapTrade(<Ethereumish>chain, connector, req);
  } else if (connector instanceof Tinyman) {
    return tinymanTrade(chain as unknown as Algorand, connector, req);
  } else {
    return refTrade(<Nearish>chain, connector as RefAMMish, req);
  }
}

export async function addLiquidity(
  req: AddLiquidityRequest | CosmosAddLiquidityRequest
): Promise<AddLiquidityResponse | CosmosAddLiquidityResponse> {
  const chain = await getInitializedChain<Ethereumish | Osmosis>(req.chain, req.network);
  if (chain instanceof Osmosis){
    return chain.controller.addLiquidity(chain as unknown as Osmosis, req as CosmosAddLiquidityRequest);
  }
  const connector: UniswapLPish = await getConnector<UniswapLPish>(
    req.chain,
    req.network,
    req.connector
  );
  return uniswapV3AddLiquidity(chain as unknown as Ethereumish, connector, req as AddLiquidityRequest);
}

export async function reduceLiquidity(
  req: RemoveLiquidityRequest | CosmosRemoveLiquidityRequest
): Promise<RemoveLiquidityResponse | CosmosRemoveLiquidityResponse> {
  const chain = await getInitializedChain<Ethereumish | Osmosis>(req.chain, req.network);
  if (chain instanceof Osmosis){
    return chain.controller.removeLiquidity(chain as unknown as Osmosis, req as CosmosRemoveLiquidityRequest);
  }
  const connector: UniswapLPish= await getConnector<UniswapLPish>(
    req.chain,
    req.network,
    req.connector
  );
  return uniswapV3RemoveLiquidity(chain as unknown as Ethereumish, connector, req as RemoveLiquidityRequest);
}

export async function collectFees(
  req: CollectEarnedFeesRequest
): Promise<RemoveLiquidityResponse> {
  const chain = await getInitializedChain<Ethereumish | Osmosis>(req.chain, req.network);
  if (chain instanceof Osmosis){
    throw new HttpException(
      500,
      COLLECTFEES_ENDPOINT_NOT_SUPPORTED_ERROR_MESSAGE,
      COLLECTFEES_ENDPOINT_NOT_SUPPORTED_ERROR_CODE
    );
  }
  const connector: UniswapLPish = await getConnector<UniswapLPish>(
    req.chain,
    req.network,
    req.connector
  );
  return uniswapV3CollectEarnedFees(chain, connector, req);
}

export async function positionInfo(
  req: PositionRequest | CosmosPoolPositionsRequest
): Promise<PositionResponse | CosmosPoolPositionsResponse> {
  const chain = await getInitializedChain<Ethereumish | Osmosis>(req.chain, req.network);
  if (chain instanceof Osmosis){
    return chain.controller.poolPositions(chain as unknown as Osmosis, req as CosmosPoolPositionsRequest);
  }
  const connector: UniswapLPish = await getConnector<UniswapLPish>(
    req.chain,
    req.network,
    req.connector
  );
  return uniswapV3PositionInfo(chain, connector, req as PositionRequest);
}

 export async function poolPrice(
  req: PoolPriceRequest | CosmosPoolPriceRequest
): Promise<PoolPriceResponse | CosmosPoolPriceResponse> {
  const chain = await getInitializedChain<Ethereumish | Osmosis>(req.chain, req.network);
  if (chain instanceof Osmosis){
    return chain.controller.poolPrice(chain as unknown as Osmosis, req as CosmosPoolPriceRequest);
  }
  const connector: UniswapLPish = await getConnector<UniswapLPish>(
    req.chain,
    req.network,
    req.connector
  );
  return uniswapV3PoolPrice(chain, connector, req as PoolPriceRequest);
}

export async function estimateGas(
  req: NetworkSelectionRequest
): Promise<EstimateGasResponse> {
  const chain = await getInitializedChain<Algorand | Ethereumish | Nearish | Tezosish | Osmosis>(
    req.chain,
    req.network
  );
  if (chain instanceof Osmosis){
    return chain.controller.estimateGas(chain as unknown as Osmosis);
  }

  const connector: Uniswapish | RefAMMish | Tinyman | Plenty = await getConnector<
    Uniswapish | RefAMMish | Plenty
  >(req.chain, req.network, req.connector);

  if (connector instanceof Plenty) {
    return plentyEstimateGas(<Tezosish>chain, connector);
  } else if ('routerAbi' in connector) {
    // we currently use the presence of routerAbi to distinguish Uniswapish from RefAMMish
    return uniswapEstimateGas(<Ethereumish>chain, connector);
  } else if (connector instanceof Tinyman) {
    return tinymanEstimateGas(chain as unknown as Algorand, connector);
  } else {
    return refEstimateGas(<Nearish>chain, connector as RefAMMish);
  }
}

export async function perpMarketPrices(
  req: PriceRequest
): Promise<PerpPricesResponse> {
  const chain = await getInitializedChain<Ethereumish>(req.chain, req.network);
  const connector: Perpish = await getConnector<Perpish>(
    req.chain,
    req.network,
    req.connector
  );
  return perpPriceData(chain, connector, req);
}

export async function perpOrder(
  req: PerpCreateTakerRequest,
  isOpen: boolean
): Promise<PerpCreateTakerResponse> {
  const chain = await getInitializedChain<Ethereumish>(req.chain, req.network);
  const connector: Perpish = await getConnector<Perpish>(
    req.chain,
    req.network,
    req.connector,
    req.address
  );
  return createTakerOrder(chain, connector, req, isOpen);
}

export async function perpPosition(
  req: PerpPositionRequest
): Promise<PerpPositionResponse> {
  const chain = await getInitializedChain<Ethereumish>(req.chain, req.network);
  const connector: Perpish = await getConnector<Perpish>(
    req.chain,
    req.network,
    req.connector,
    req.address
  );
  return getPosition(chain, connector, req);
}

export async function perpBalance(
  req: PerpBalanceRequest
): Promise<PerpBalanceResponse> {
  const chain = await getInitializedChain(req.chain, req.network);
  const connector: Perpish = <Perpish>(
    await getConnector(req.chain, req.network, req.connector, req.address)
  );
  return getAccountValue(chain, connector);
}

export async function perpPairs(
  req: NetworkSelectionRequest
): Promise<PerpAvailablePairsResponse> {
  const chain = await getInitializedChain<Ethereumish>(req.chain, req.network);
  const connector: Perpish = await getConnector<Perpish>(
    req.chain,
    req.network,
    req.connector
  );
  return getAvailablePairs(chain, connector);
}

export async function getMarketStatus(
  req: PerpMarketRequest
): Promise<PerpMarketResponse> {
  const chain = await getInitializedChain<Ethereumish>(req.chain, req.network);
  const connector: Perpish = await getConnector<Perpish>(
    req.chain,
    req.network,
    req.connector
  );
  return checkMarketStatus(chain, connector, req);
}

export async function estimatePerpGas(
  req: NetworkSelectionRequest
): Promise<EstimateGasResponse> {
  const chain = await getInitializedChain<Ethereumish>(req.chain, req.network);
  const connector: Perpish = await getConnector<Perpish>(
    req.chain,
    req.network,
    req.connector
  );
  return perpEstimateGas(chain, connector);
}
