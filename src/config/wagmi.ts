import { http, createConfig, fallback } from 'wagmi'
import { monadTestnet } from 'viem/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [monadTestnet.id]: fallback([
      http('https://monad-testnet.g.alchemy.com/v2/TyMm_BC9XRvir9enYbfqR'),
      http('https://rpc.ankr.com/monad_testnet'),
      http('https://monad-testnet.drpc.org')
    ]),
  },
})
